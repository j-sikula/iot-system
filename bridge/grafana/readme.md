
# Grafana

## Install

```bash
sudo systemctl daemon-reload
sudo systemctl start grafana-server

```

To verify that the service is running, run the following command:

```Bash
sudo systemctl status grafana-server
```
Configure the Grafana server to start at boot using systemd


```Bash
sudo systemctl enable grafana-server.service
```

Edit port with 
```bash
sudo nano /etc/grafana/grafana.ini
```

```toml
[server]
# Protocol (http, https, h2, socket, socket_h2)
protocol = http


# Allow only loopback at server, Nginxwill open grafana to world over TLS
http_addr =127.0.0.1

# The http port to use
http_port = 3030

```

Restart the Grafana server using systemd


```Bash
sudo systemctl restart grafana-server
```