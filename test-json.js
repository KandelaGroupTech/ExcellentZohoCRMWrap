try {
  let s = '{"owner":"RA"}\r';
  JSON.parse(s);
  console.log('Success');
} catch(e) {
  console.log('Error:', e.message);
}
