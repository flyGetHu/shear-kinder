import http.server
import socketserver
import webbrowser
import os
import signal
import sys


def main():
    port = 8080
    src_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src")
    os.chdir(src_dir)

    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}"
        print(f"AI魔法课 Slides 已启动: {url}")
        print("按 Ctrl+C 停止服务器")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
            httpd.shutdown()


if __name__ == "__main__":
    main()
