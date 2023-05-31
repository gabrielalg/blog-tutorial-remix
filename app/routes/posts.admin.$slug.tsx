import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import type { ActionArgs, LoaderArgs } from "@remix-run/node";
import invariant from "tiny-invariant";

import { createPost, getPost, updatePost } from "~/models/post.server";
import { requireAdminUser } from "~/session.server";
import type { Post } from "@prisma/client";

type LoaderData = {
  post?: Post;
};

export const loader = async ({ request, params }: LoaderArgs) => {
  invariant(params.slug, `params.slug is required`);
  await requireAdminUser(request);

  if (params.slug === "new") {
    return json<LoaderData>({});
  }

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  return json<LoaderData>({ post });
};

export const action = async ({ request, params }: ActionArgs) => {
  await requireAdminUser(request);
  // TODO: remove me
  await new Promise((res) => setTimeout(res, 1000));
  const formData = await request.formData();

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors = {
    title: title ? null : "Title is required",
    slug: slug ? null : "Slug is required",
    markdown: markdown ? null : "Markdown is required",
  };
  const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
  if (hasErrors) {
    return json(errors);
  }
  invariant(typeof title === "string", "title must be a string");
  invariant(typeof slug === "string", "slug must be a string");
  invariant(typeof markdown === "string", "markdown must be a string");

  if (params.slug === "new") {
    await createPost({ title, slug, markdown });
  } else {
    await updatePost(params.slug, { title, slug, markdown });
  }

  return redirect("/posts/admin");
};

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

export default function NewPost() {
  const { post } = useLoaderData<typeof loader>();
  const errors = useActionData<typeof action>();
  const navigation = useNavigation();

  const isNewPost = !post;
  const isCreating = Boolean(navigation.formData?.get("intent") === "create");
  const isUpdating = Boolean(navigation.formData?.get("intent") === "update");

  return (
    <Form method="post" key={post?.slug ?? "new"}>
      <p>
        <label>
          Post Title:{" "}
          {errors?.title ? (
            <em className="text-red-600">{errors.title}</em>
          ) : null}
          <input
            type="text"
            name="title"
            className={inputClassName}
            defaultValue={post?.title}
          />
        </label>
      </p>
      <p>
        <label>
          Post Slug:{" "}
          {errors?.slug ? (
            <em className="text-red-600">{errors.slug}</em>
          ) : null}
          <input
            type="text"
            name="slug"
            className={inputClassName}
            defaultValue={post?.slug}
          />
        </label>
      </p>
      <p>
        <label htmlFor="markdown">
          Markdown:{" "}
          {errors?.markdown ? (
            <em className="text-red-600">{errors.markdown}</em>
          ) : null}{" "}
        </label>
        <br />
        <textarea
          id="markdown"
          rows={20}
          name="markdown"
          className={`${inputClassName} font-mono`}
          defaultValue={post?.markdown}
        />
      </p>
      <p className="text-right">
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
          disabled={isCreating || isUpdating}
          name="intent"
          value={isNewPost ? "create" : "update"}
        >
          {isNewPost
            ? isCreating
              ? "Creating..."
              : "Create Post"
            : isUpdating
            ? "Updating..."
            : "Update Post"}
        </button>
      </p>
    </Form>
  );
}
