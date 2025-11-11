const recBtn = document.getElementById('recBtn');
const audioOut = document.getElementById('audioOut');
const audioOutText = document.getElementById('audioOutText');
const textIn = document.getElementById('textIn');
const sendBtn = document.getElementById('sendBtn');
const updBtn = document.getElementById('updBtn');
const logEl = document.getElementById('log');

let mediaRecorder, chunks = [], isRecording = false;

function log(msg){ logEl.textContent = `[${new Date().toLocaleTimeString()}] ${msg}\n` + logEl.textContent; }

recBtn.onclick = async () => {
  if (!isRecording) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    chunks = [];
    mediaRecorder.ondataavailable = e => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      const form = new FormData();
      form.append('audio', blob, 'input.webm');
      log('Sending voice...');
      const res = await fetch('/api/voice', { method: 'POST', body: form });
      if (!res.ok) {
        const t = await res.text();
        log('Error: ' + t);
        return;
      }
      const arrayBuf = await res.arrayBuffer();
      const outBlob = new Blob([arrayBuf], { type: 'audio/mpeg' });
      audioOut.src = URL.createObjectURL(outBlob);
      audioOut.play();
      log('Got reply (voice).');
    };
    mediaRecorder.start();
    isRecording = true;
    recBtn.textContent = 'Stop Recording';
    log('Recording...');
  } else {
    mediaRecorder.stop();
    isRecording = false;
    recBtn.textContent = 'Start Recording';
    log('Stopped.');
  }
};

sendBtn.onclick = async () => {
  const text = textIn.value.trim();
  if (!text) return;
  log(`Sending text: ${text}`);
  const res = await fetch('/api/text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) {
    const t = await res.text();
    log('Error: ' + t);
    return;
  }
  const arrayBuf = await res.arrayBuffer();
  const outBlob = new Blob([arrayBuf], { type: 'audio/mpeg' });
  audioOutText.src = URL.createObjectURL(outBlob);
  audioOutText.play();
  log('Got reply (text->voice).');
};

updBtn.onclick = async () => {
  const res = await fetch('/api/sample-update');
  const { update } = await res.json();
  log(`Update: ${update}`);
  document.getElementById('upd').textContent = update;
};
