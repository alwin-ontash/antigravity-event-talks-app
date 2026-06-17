import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, request
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def fetch_and_parse_feed():
    """Fetches the Atom feed and parses it into a list of release notes."""
    try:
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
            
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry_node in root.findall('atom:entry', ns):
            title_node = entry_node.find('atom:title', ns)
            updated_node = entry_node.find('atom:updated', ns)
            content_node = entry_node.find('atom:content', ns)
            link_node = entry_node.find('atom:link', ns)
            
            title = title_node.text if title_node is not None else "Unknown Date"
            updated = updated_node.text if updated_node is not None else ""
            content = content_node.text if content_node is not None else ""
            
            link = ""
            if link_node is not None:
                link = link_node.attrib.get('href', '')
                
            entries.append({
                'id': entry_node.find('atom:id', ns).text if entry_node.find('atom:id', ns) is not None else "",
                'title': title,
                'updated': updated,
                'content': content,
                'link': link
            })
            
        return entries, None
    except Exception as e:
        logger.error(f"Error fetching/parsing feed: {str(e)}")
        return [], str(e)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    entries, error = fetch_and_parse_feed()
    if error:
        return jsonify({'error': error, 'entries': []}), 500
    return jsonify({'entries': entries})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
