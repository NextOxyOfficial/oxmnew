"use client";

import React from "react";

const OrdersHeader: React.FC = () => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
        Sales
      </h1>
      <p className="text-gray-400 text-sm sm:text-base mt-2">
        View and manage customer sales and transactions
      </p>
    </div>
  );
};

export default React.memo(OrdersHeader);
