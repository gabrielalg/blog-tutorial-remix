import { json } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";

import { getPostsListings } from "~/models/post.server";
import { useOptionalAdminUser } from "~/utils";

export const loader = async () => {
  return json({ posts: await getPostsListings() });
};

export default function Posts() {
  const { posts } = useLoaderData<typeof loader>();
  const adminUser = useOptionalAdminUser();

  return (
    <main>
      <h1>Posts</h1>
      {adminUser && (
        <Link to="admin" className="text-red-600 underline">
          Admin
        </Link>
      )}
      <ul>
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              to={post.slug}
              prefetch="intent"
              className="text-blue-600 underline"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
