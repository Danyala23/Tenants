var builder = DistributedApplication.CreateBuilder(args);

builder.AddProject<Projects.Tenants_Server>("tenants-server");

builder.Build().Run();
