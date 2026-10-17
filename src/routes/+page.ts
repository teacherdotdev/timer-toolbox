import { redirect } from "@sveltejs/kit";
import { resolve } from "$app/paths";

// The pie timer is the only tool for now. When there's a second, a page listing
// the tools replaces this redirect, and bookmarks to /pie keep working.
export function load() {
  redirect(307, resolve("/pie"));
}
