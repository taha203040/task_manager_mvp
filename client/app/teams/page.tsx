import ProtectedRoute from "@/components/Protected";

import React from "react";

const Page = () => {
  return <ProtectedRoute>
    <section>Teams</section>
  </ProtectedRoute>;
};

export default Page;
