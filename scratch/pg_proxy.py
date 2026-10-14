import socket
import threading
import sys

def forward(src, dst):
    try:
        while True:
            data = src.recv(4096)
            if not data:
                break
            dst.sendall(data)
    except Exception:
        pass
    finally:
        try:
            src.close()
        except Exception:
            pass
        try:
            dst.close()
        except Exception:
            pass

def main():
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(('0.0.0.0', 5432))
    server.listen(100)
    print("Postgres proxy listening on 0.0.0.0:5432 -> 127.0.0.1:5431", flush=True)

    while True:
        client, addr = server.accept()
        target = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            target.connect(('127.0.0.1', 5431))
            threading.Thread(target=forward, args=(client, target), daemon=True).start()
            threading.Thread(target=forward, args=(target, client), daemon=True).start()
        except Exception as e:
            client.close()

if __name__ == '__main__':
    main()
