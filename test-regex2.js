const desc = 'Some desc\n---DEAL_META---\n{"owner":"AB"}\n---DEAL_META---\n{"owner":"CD"}';
const match = desc.match(/---DEAL_META---\n([\s\S]*)/);
if (match) {
  try {
    console.log(JSON.parse(match[1]));
  } catch(e) {
    console.log('Parse error:', e.message);
  }
}
