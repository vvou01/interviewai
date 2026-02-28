import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { session_id, audio_base64, mime_type = 'audio/webm' } = body;

    if (!session_id || !audio_base64) {
      return Response.json({ error: 'session_id and audio_base64 are required' }, { status: 400 });
    }

    const sessions = await base44.entities.InterviewSessions.filter({ id: session_id });
    const session = sessions[0];
    if (!session) return Response.json({ error: 'Session not found' }, { status: 404 });

    // Decode base64 audio
    const audioBytes = Uint8Array.from(atob(audio_base64), c => c.charCodeAt(0));

    // Send to Deepgram for transcription
    const deepgramRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true&punctuate=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${Deno.env.get('DEEPGRAM_API_KEY')}`,
        'Content-Type': mime_type,
      },
      body: audioBytes,
    });

    if (!deepgramRes.ok) {
      const err = await deepgramRes.text();
      return Response.json({ error: `Deepgram error: ${err}` }, { status: 500 });
    }

    const dgData = await deepgramRes.json();
    const results = dgData?.results?.channels?.[0]?.alternatives?.[0];
    const transcript = results?.transcript || '';
    const words = results?.words || [];

    if (!transcript) {
      return Response.json({ transcript: '', entries: [] });
    }

    // Build transcript entries with speaker diarization
    const entries = [];
    let currentSpeaker = null;
    let currentText = '';
    let startTime = 0;

    for (const word of words) {
      const speaker = word.speaker ?? 0;
      if (currentSpeaker === null) {
        currentSpeaker = speaker;
        startTime = word.start;
      }
      if (speaker !== currentSpeaker) {
        if (currentText.trim()) {
          entries.push({
            session_id,
            speaker: currentSpeaker === 0 ? 'interviewer' : 'candidate',
            text: currentText.trim(),
            timestamp_seconds: Math.round(startTime),
          });
        }
        currentSpeaker = speaker;
        currentText = word.punctuated_word || word.word;
        startTime = word.start;
      } else {
        currentText += ' ' + (word.punctuated_word || word.word);
      }
    }

    if (currentText.trim()) {
      entries.push({
        session_id,
        speaker: currentSpeaker === 0 ? 'interviewer' : 'candidate',
        text: currentText.trim(),
        timestamp_seconds: Math.round(startTime),
      });
    }

    // Save transcript entries
    for (const entry of entries) {
      await base44.entities.TranscriptEntries.create(entry);
    }

    return Response.json({ transcript, entries });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
