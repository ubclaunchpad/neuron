import { backend } from '../data/constants';

export const formatImageUrl = (image_id) => {
  return `${backend}/image/${image_id}`
}