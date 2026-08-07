"use client";

import React from "react";

const OrdersHeader: React.FC = () => {
  return (
    <header className="page-head">
      <div>
        <h1 className="page-title">বিক্রি ও অর্ডার</h1>
        <p className="page-sub">কাস্টমারের সব বিক্রি আর লেনদেনের হিসাব</p>
      </div>
    </header>
  );
};

export default React.memo(OrdersHeader);
