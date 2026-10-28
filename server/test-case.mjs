import fetch from 'node-fetch';

async function testCreateCase() {
  console.log('Testing case creation...');
  
  const res = await fetch('http://localhost:5000/api/cases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      premise: 'A reclusive watchmaker is found dead in his locked workshop with a shattered pocket watch frozen at midnight.',
      difficulty: 'medium',
      tone: 'noir',
    }),
  });
  
  const data = await res.json();
  console.log('Create case response:', JSON.stringify(data, null, 2));
  
  if (!data.ok) {
    console.error('Case creation failed!');
    process.exit(1);
  }
  
  const caseId = data.data.caseId;
  console.log(`\nCase created: ${caseId}`);
  console.log('Polling status for up to 120 seconds...\n');
  
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 2000));
    
    const statusRes = await fetch(`http://localhost:5000/api/cases/${caseId}/status`, {
      headers: { 'Cookie': res.headers.get('set-cookie') || '' }
    });
    const statusData = await statusRes.json();
    
    if (statusData.ok) {
      const { status, generationStage, progress } = statusData.data;
      process.stdout.write(`\r[${i*2}s] status=${status} stage=${generationStage} progress=${progress}%   `);
      
      if (status === 'ready') {
        console.log('\n\n✅ Case is READY!');
        process.exit(0);
      } else if (status === 'failed') {
        console.log('\n\n❌ Case FAILED:', statusData.data.error);
        process.exit(1);
      }
    }
  }
  
  console.log('\nTimeout waiting for case to be ready');
  process.exit(1);
}

testCreateCase().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

