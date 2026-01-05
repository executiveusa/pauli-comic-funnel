"""
Kubernetes MCP Server
Container orchestration management through Model Context Protocol
"""

import os
import json
from typing import Optional, Dict, Any, List
from datetime import datetime
from kubernetes import client, config
from kubernetes.client.rest import ApiException
from fastmcp import FastMCP

# Initialize FastMCP server
mcp = FastMCP("kubernetes-mcp")

# Load Kubernetes configuration
try:
    # Try in-cluster config first
    config.load_incluster_config()
except:
    # Fall back to kubeconfig
    config.load_kube_config()


class K8sManager:
    """Manages Kubernetes operations with proper error handling"""

    def __init__(self):
        self.core_v1 = client.CoreV1Api()
        self.apps_v1 = client.AppsV1Api()
        self.batch_v1 = client.BatchV1Api()
        self.networking_v1 = client.NetworkingV1Api()

    @staticmethod
    def handle_api_exception(e: ApiException) -> Dict[str, Any]:
        """Convert Kubernetes API exceptions to structured error responses"""
        try:
            error_body = json.loads(e.body)
        except:
            error_body = {"message": str(e)}

        return {
            "success": False,
            "error": error_body.get("message", str(e)),
            "status_code": e.status,
            "reason": e.reason
        }


k8s = K8sManager()


@mcp.tool()
def k8s_list_pods(
    namespace: str = "default",
    label_selector: Optional[str] = None,
    field_selector: Optional[str] = None
) -> Dict[str, Any]:
    """
    List pods in a namespace

    Args:
        namespace: Kubernetes namespace
        label_selector: Filter by labels (e.g., 'app=nginx')
        field_selector: Filter by fields (e.g., 'status.phase=Running')

    Returns:
        Dictionary with list of pods and their status
    """
    try:
        pods = k8s.core_v1.list_namespaced_pod(
            namespace=namespace,
            label_selector=label_selector,
            field_selector=field_selector
        )

        pod_list = []
        for pod in pods.items:
            pod_info = {
                "name": pod.metadata.name,
                "namespace": pod.metadata.namespace,
                "status": pod.status.phase,
                "node": pod.spec.node_name,
                "ip": pod.status.pod_ip,
                "created": pod.metadata.creation_timestamp.isoformat() if pod.metadata.creation_timestamp else None,
                "labels": pod.metadata.labels,
                "containers": [
                    {
                        "name": c.name,
                        "image": c.image,
                        "ready": any(cs.name == c.name and cs.ready for cs in (pod.status.container_statuses or []))
                    }
                    for c in pod.spec.containers
                ]
            }
            pod_list.append(pod_info)

        return {
            "success": True,
            "namespace": namespace,
            "count": len(pod_list),
            "pods": pod_list
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_get_pod_logs(
    pod_name: str,
    namespace: str = "default",
    container: Optional[str] = None,
    tail_lines: int = 100,
    follow: bool = False,
    previous: bool = False
) -> Dict[str, Any]:
    """
    Get logs from a pod

    Args:
        pod_name: Name of the pod
        namespace: Kubernetes namespace
        container: Specific container name (if pod has multiple containers)
        tail_lines: Number of lines to retrieve from end of logs
        follow: Stream logs (not supported in MCP)
        previous: Get logs from previous container instance

    Returns:
        Dictionary with pod logs
    """
    try:
        logs = k8s.core_v1.read_namespaced_pod_log(
            name=pod_name,
            namespace=namespace,
            container=container,
            tail_lines=tail_lines,
            follow=False,  # MCP doesn't support streaming
            previous=previous
        )

        return {
            "success": True,
            "pod_name": pod_name,
            "namespace": namespace,
            "container": container,
            "tail_lines": tail_lines,
            "logs": logs
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_create_deployment(
    name: str,
    image: str,
    namespace: str = "default",
    replicas: int = 1,
    port: Optional[int] = None,
    env_vars: Optional[Dict[str, str]] = None,
    labels: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Create a new deployment

    Args:
        name: Deployment name
        image: Container image
        namespace: Kubernetes namespace
        replicas: Number of replicas
        port: Container port to expose
        env_vars: Environment variables
        labels: Pod labels

    Returns:
        Dictionary with deployment creation status
    """
    try:
        # Default labels
        if labels is None:
            labels = {"app": name}

        # Container spec
        container = client.V1Container(
            name=name,
            image=image,
            ports=[client.V1ContainerPort(container_port=port)] if port else None,
            env=[
                client.V1EnvVar(name=k, value=v)
                for k, v in (env_vars or {}).items()
            ]
        )

        # Pod template
        template = client.V1PodTemplateSpec(
            metadata=client.V1ObjectMeta(labels=labels),
            spec=client.V1PodSpec(containers=[container])
        )

        # Deployment spec
        spec = client.V1DeploymentSpec(
            replicas=replicas,
            selector=client.V1LabelSelector(match_labels=labels),
            template=template
        )

        # Deployment object
        deployment = client.V1Deployment(
            api_version="apps/v1",
            kind="Deployment",
            metadata=client.V1ObjectMeta(name=name, labels=labels),
            spec=spec
        )

        # Create deployment
        result = k8s.apps_v1.create_namespaced_deployment(
            namespace=namespace,
            body=deployment
        )

        return {
            "success": True,
            "name": name,
            "namespace": namespace,
            "replicas": replicas,
            "image": image,
            "created": result.metadata.creation_timestamp.isoformat() if result.metadata.creation_timestamp else None
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_scale_deployment(
    name: str,
    replicas: int,
    namespace: str = "default"
) -> Dict[str, Any]:
    """
    Scale a deployment to specified number of replicas

    Args:
        name: Deployment name
        replicas: Target number of replicas
        namespace: Kubernetes namespace

    Returns:
        Dictionary with scaling operation status
    """
    try:
        # Get current deployment
        deployment = k8s.apps_v1.read_namespaced_deployment(name, namespace)

        # Update replicas
        deployment.spec.replicas = replicas

        # Patch deployment
        result = k8s.apps_v1.patch_namespaced_deployment(
            name=name,
            namespace=namespace,
            body=deployment
        )

        return {
            "success": True,
            "name": name,
            "namespace": namespace,
            "previous_replicas": deployment.spec.replicas,
            "new_replicas": replicas,
            "updated": result.metadata.generation
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_delete_deployment(
    name: str,
    namespace: str = "default"
) -> Dict[str, Any]:
    """
    Delete a deployment

    Args:
        name: Deployment name
        namespace: Kubernetes namespace

    Returns:
        Dictionary with deletion status
    """
    try:
        k8s.apps_v1.delete_namespaced_deployment(
            name=name,
            namespace=namespace,
            body=client.V1DeleteOptions(
                propagation_policy='Foreground'
            )
        )

        return {
            "success": True,
            "name": name,
            "namespace": namespace,
            "deleted": True
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_list_services(
    namespace: str = "default",
    label_selector: Optional[str] = None
) -> Dict[str, Any]:
    """
    List services in a namespace

    Args:
        namespace: Kubernetes namespace
        label_selector: Filter by labels

    Returns:
        Dictionary with list of services
    """
    try:
        services = k8s.core_v1.list_namespaced_service(
            namespace=namespace,
            label_selector=label_selector
        )

        service_list = []
        for svc in services.items:
            service_info = {
                "name": svc.metadata.name,
                "namespace": svc.metadata.namespace,
                "type": svc.spec.type,
                "cluster_ip": svc.spec.cluster_ip,
                "external_ips": svc.spec.external_i_ps,
                "ports": [
                    {
                        "name": p.name,
                        "port": p.port,
                        "target_port": str(p.target_port),
                        "protocol": p.protocol
                    }
                    for p in (svc.spec.ports or [])
                ],
                "selector": svc.spec.selector,
                "labels": svc.metadata.labels
            }
            service_list.append(service_info)

        return {
            "success": True,
            "namespace": namespace,
            "count": len(service_list),
            "services": service_list
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_create_service(
    name: str,
    port: int,
    target_port: int,
    namespace: str = "default",
    service_type: str = "ClusterIP",
    selector: Optional[Dict[str, str]] = None,
    labels: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Create a new service

    Args:
        name: Service name
        port: Service port
        target_port: Target container port
        namespace: Kubernetes namespace
        service_type: Type of service (ClusterIP, NodePort, LoadBalancer)
        selector: Pod selector labels
        labels: Service labels

    Returns:
        Dictionary with service creation status
    """
    try:
        if selector is None:
            selector = {"app": name}

        if labels is None:
            labels = {"app": name}

        service = client.V1Service(
            api_version="v1",
            kind="Service",
            metadata=client.V1ObjectMeta(name=name, labels=labels),
            spec=client.V1ServiceSpec(
                type=service_type,
                selector=selector,
                ports=[
                    client.V1ServicePort(
                        port=port,
                        target_port=target_port
                    )
                ]
            )
        )

        result = k8s.core_v1.create_namespaced_service(
            namespace=namespace,
            body=service
        )

        return {
            "success": True,
            "name": name,
            "namespace": namespace,
            "type": service_type,
            "port": port,
            "target_port": target_port,
            "cluster_ip": result.spec.cluster_ip
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_get_configmap(
    name: str,
    namespace: str = "default"
) -> Dict[str, Any]:
    """
    Get a ConfigMap

    Args:
        name: ConfigMap name
        namespace: Kubernetes namespace

    Returns:
        Dictionary with ConfigMap data
    """
    try:
        configmap = k8s.core_v1.read_namespaced_config_map(name, namespace)

        return {
            "success": True,
            "name": name,
            "namespace": namespace,
            "data": configmap.data,
            "binary_data": configmap.binary_data,
            "labels": configmap.metadata.labels
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_create_configmap(
    name: str,
    data: Dict[str, str],
    namespace: str = "default",
    labels: Optional[Dict[str, str]] = None
) -> Dict[str, Any]:
    """
    Create a ConfigMap

    Args:
        name: ConfigMap name
        data: Configuration data as key-value pairs
        namespace: Kubernetes namespace
        labels: ConfigMap labels

    Returns:
        Dictionary with ConfigMap creation status
    """
    try:
        configmap = client.V1ConfigMap(
            api_version="v1",
            kind="ConfigMap",
            metadata=client.V1ObjectMeta(name=name, labels=labels),
            data=data
        )

        result = k8s.core_v1.create_namespaced_config_map(
            namespace=namespace,
            body=configmap
        )

        return {
            "success": True,
            "name": name,
            "namespace": namespace,
            "keys": list(data.keys()),
            "created": result.metadata.creation_timestamp.isoformat() if result.metadata.creation_timestamp else None
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_get_secret(
    name: str,
    namespace: str = "default",
    decode: bool = True
) -> Dict[str, Any]:
    """
    Get a Secret (use with caution)

    Args:
        name: Secret name
        namespace: Kubernetes namespace
        decode: Decode base64 values

    Returns:
        Dictionary with Secret data
    """
    try:
        secret = k8s.core_v1.read_namespaced_secret(name, namespace)

        data = {}
        if decode and secret.data:
            import base64
            for key, value in secret.data.items():
                try:
                    data[key] = base64.b64decode(value).decode('utf-8')
                except:
                    data[key] = "<binary data>"
        else:
            data = secret.data

        return {
            "success": True,
            "name": name,
            "namespace": namespace,
            "type": secret.type,
            "data": data,
            "labels": secret.metadata.labels
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_list_namespaces() -> Dict[str, Any]:
    """
    List all namespaces in the cluster

    Returns:
        Dictionary with list of namespaces
    """
    try:
        namespaces = k8s.core_v1.list_namespace()

        namespace_list = []
        for ns in namespaces.items:
            namespace_info = {
                "name": ns.metadata.name,
                "status": ns.status.phase,
                "created": ns.metadata.creation_timestamp.isoformat() if ns.metadata.creation_timestamp else None,
                "labels": ns.metadata.labels
            }
            namespace_list.append(namespace_info)

        return {
            "success": True,
            "count": len(namespace_list),
            "namespaces": namespace_list
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_get_node_status() -> Dict[str, Any]:
    """
    Get status of all nodes in the cluster

    Returns:
        Dictionary with node information and health status
    """
    try:
        nodes = k8s.core_v1.list_node()

        node_list = []
        for node in nodes.items:
            conditions = {c.type: c.status for c in (node.status.conditions or [])}

            node_info = {
                "name": node.metadata.name,
                "ready": conditions.get("Ready", "Unknown"),
                "roles": [
                    label.replace("node-role.kubernetes.io/", "")
                    for label in (node.metadata.labels or {})
                    if label.startswith("node-role.kubernetes.io/")
                ],
                "version": node.status.node_info.kubelet_version,
                "os": node.status.node_info.operating_system,
                "architecture": node.status.node_info.architecture,
                "capacity": {
                    "cpu": node.status.capacity.get("cpu"),
                    "memory": node.status.capacity.get("memory"),
                    "pods": node.status.capacity.get("pods")
                },
                "allocatable": {
                    "cpu": node.status.allocatable.get("cpu"),
                    "memory": node.status.allocatable.get("memory"),
                    "pods": node.status.allocatable.get("pods")
                },
                "conditions": conditions
            }
            node_list.append(node_info)

        return {
            "success": True,
            "count": len(node_list),
            "nodes": node_list
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@mcp.tool()
def k8s_execute_command(
    pod_name: str,
    command: List[str],
    namespace: str = "default",
    container: Optional[str] = None
) -> Dict[str, Any]:
    """
    Execute a command in a pod

    Args:
        pod_name: Name of the pod
        command: Command to execute as list (e.g., ['ls', '-la'])
        namespace: Kubernetes namespace
        container: Specific container name

    Returns:
        Dictionary with command output
    """
    try:
        from kubernetes.stream import stream

        resp = stream(
            k8s.core_v1.connect_get_namespaced_pod_exec,
            pod_name,
            namespace,
            container=container,
            command=command,
            stderr=True,
            stdin=False,
            stdout=True,
            tty=False
        )

        return {
            "success": True,
            "pod_name": pod_name,
            "namespace": namespace,
            "container": container,
            "command": " ".join(command),
            "output": resp
        }
    except ApiException as e:
        return k8s.handle_api_exception(e)
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":
    # Run the MCP server
    mcp.run()
