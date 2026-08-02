import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirect to admin page as the home page
  redirect("/admin");
}
