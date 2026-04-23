async function getCompilers() {
  const res = await fetch('https://wandbox.org/api/list.json');
  const list = await res.json();
  const pythons = list.filter(c => c.language === 'Python');
  console.log(pythons.map(p => p.name).join(', '));
}
getCompilers();
