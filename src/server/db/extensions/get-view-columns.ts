import type { View } from "drizzle-orm";

/**
 * Get the columns of a view
 * 
 * @param view - The view to get the columns from
 * @returns The columns of the view
 */
export const getViewColumns = <T extends View>(view: T): T['_']['selectedFields'] => {
    return view._.selectedFields;
}