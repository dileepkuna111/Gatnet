output "website_url" {
  description = "Open this URL in your browser after the targets become healthy."
  value       = "http://${aws_lb.app.dns_name}"
}
output "load_balancer_dns" {
  value = aws_lb.app.dns_name
}
output "target_group_arn" {
  value = aws_lb_target_group.app.arn
}
output "autoscaling_group_name" {
  value = aws_autoscaling_group.app.name
}
output "artifact_bucket" {
  value = aws_s3_bucket.artifact.bucket
}
