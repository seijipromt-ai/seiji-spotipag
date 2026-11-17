import os
import yt_dlp
from flask import Flask, request, jsonify, render_template, send_file, after_this_request

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/search", methods=["POST"])
def search():
    data = request.get_json()
    query = data.get("query", "").strip()
    if not query: 
        return jsonify({"ok": False, "err": "Query required"}), 400

    ydl_opts = {
        'quiet': True,
        'extract_flat': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            result = ydl.extract_info(f"ytsearch20:{query}", download=False)
            tracks = []
            for entry in result.get('entries', []):
                thumb = entry.get('thumbnails', [{}])[-1].get('url', '') if entry.get('thumbnails') else ''
                tracks.append({
                    "id": entry.get('id'),
                    "title": entry.get('title'),
                    "artist": entry.get('uploader', 'Unknown Artist'),
                    "duration": entry.get('duration', 0),
                    "cover": thumb
                })
            return jsonify({"ok": True, "data": tracks})
    except Exception as e:
        return jsonify({"ok": False, "err": str(e)}), 500

@app.route("/api/download/<video_id>")
def download_audio(video_id):
    # I-download sa server as MP3 para 100% playable
    out_tmpl = f"/tmp/{video_id}.%(ext)s"
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': out_tmpl,
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'quiet': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.extract_info(f"https://www.youtube.com/watch?v={video_id}", download=True)
            
        file_path = f"/tmp/{video_id}.mp3"
        if not os.path.exists(file_path):
            return "Download failed", 500

        # Check kung gusto i-download (dl=1) o i-play lang sa browser
        as_attachment = request.args.get('dl') == '1'
        
        return send_file(
            file_path, 
            mimetype="audio/mpeg", 
            as_attachment=as_attachment, 
            download_name=f"SeijiMusic_{video_id}.mp3"
        )
    except Exception as e:
        return str(e), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
