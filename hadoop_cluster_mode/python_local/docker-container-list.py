import docker
client = docker.from_env()
containerList= client.containers.list()
for c in containerList:
    print("Running",c.name)
    for a in c.ports:
        print("-" + a)
        for t in c.ports[a]:
            print("--HostIp:" + t["HostIp"])
            print("--HostPort:" + t["HostPort"])