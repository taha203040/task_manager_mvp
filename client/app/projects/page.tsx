import ProtectedRoute from "@/components/Protected";

import React from "react";

const Page = () => {
  return (
    <ProtectedRoute>
      <section>Projects</section>
    </ProtectedRoute>
  );
};

export default Page;
