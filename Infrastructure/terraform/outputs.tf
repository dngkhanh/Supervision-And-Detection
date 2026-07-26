output "resource_group_name" {
  value = azurerm_resource_group.main.name
}

output "acr_name" {
  value = azurerm_container_registry.acr.name
}

output "acr_login_server" {
  value = azurerm_container_registry.acr.login_server
}

output "aks_name" {
  value = azurerm_kubernetes_cluster.aks.name
}

output "fixed_pool_name" {
  value = azurerm_kubernetes_cluster.aks.default_node_pool[0].name
}

output "scalable_pool_name" {
  value = azurerm_kubernetes_cluster_node_pool.scalable.name
}