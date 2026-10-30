import type { Character, Photo } from './library';
export function castReference(member: { characterId: string; outfitId?: string; role?: string }, characters: Character[], photos: Photo[]) {
  const character = characters.find(c => c.id === member.characterId);
  const outfit = member.outfitId ? photos.find(p => p.id === member.outfitId && p.characterId === member.characterId && p.kind === 'outfit') : undefined;
  const image = member.outfitId ? outfit?.image : character?.references[0];
  return {
    image,
    name: character?.name ?? 'Missing character',
    description: character?.description,
    outfit: outfit ? [outfit.title, ...(outfit.items ?? []).map(item => item.words), outfit.note].filter(Boolean).join('; ').slice(0, 1000) || 'Selected outfit reference' : undefined,
    role: member.role,
  };
}
