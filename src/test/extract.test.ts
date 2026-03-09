import { test } from 'vitest';

test('extract avatars', async () => {
  const html = await fetch('https://psprices.com/region-es/collection/avatars?platform=PSVita').then(r => r.text());
  const urls = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)]
    .map(m => m[1])
    .filter(url => url.includes('psprices.com') || url.startsWith('http') || url.startsWith('//'))
    .filter(url => url.includes('.png') || url.includes('.jpg') || url.includes('avatar'));
    
  console.log('FOUND URLS:', urls.slice(0, 35));
});