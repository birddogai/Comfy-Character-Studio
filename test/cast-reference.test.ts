import test from 'node:test';
import assert from 'node:assert/strict';
import { castReference } from '../lib/cast-reference.ts';
const characters = [{id:'a',name:'Pepe',references:['original'],createdAt:0}];
const photos = [{id:'outfit',characterId:'a',kind:'outfit' as const,image:'new-outfit',prompt:'',title:'Blue jacket',createdAt:0}];
test('selected outfit resolves its own image and description',()=>{
 const cast=castReference({characterId:'a',outfitId:'outfit'},characters,photos);
 assert.equal(cast.image,'new-outfit'); assert.equal(cast.outfit,'Blue jacket');
});
test('deleted or foreign outfits never fall back to original appearance',()=>{
 assert.equal(castReference({characterId:'a',outfitId:'missing'},characters,photos).image,undefined);
 assert.equal(castReference({characterId:'a',outfitId:'outfit'},characters,[{...photos[0],characterId:'b'}]).image,undefined);
 assert.equal(castReference({characterId:'a'},characters,photos).image,'original');
});
