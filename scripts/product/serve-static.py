"""Serve the Pages artifact locally for tests; never use as a production API."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class ArtifactServer(ThreadingHTTPServer):
    # Native apps request many assets at once. The default backlog of 5 can
    # reset Chromium connections on macOS before handler threads accept them.
    request_queue_size = 128
    daemon_threads = True


artifact = Path(__file__).resolve().parents[2] / "out"
handler = partial(SimpleHTTPRequestHandler, directory=str(artifact))
with ArtifactServer(("127.0.0.1", 4393), handler) as server:
    server.serve_forever()
