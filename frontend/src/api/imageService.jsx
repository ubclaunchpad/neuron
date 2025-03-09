import { backend } from '../data/constants';

export const formatImageUrl = (image_id) => {
  return image_id ? `${backend}/image/${image_id}` : undefined;
}