import React from "react";

const AppDetail = ({ appName, appDescription }) => {
  return (
    <div className="relative z-20 text-white text-3xl font-semibold left-6 flex flex-col">
      <span className="text-[50px] font-bold">{appName}</span>
      <hr className="w-40" />
      <span className="text-[20px]">{appDescription}</span>
    </div>
  );
};

export default AppDetail;
