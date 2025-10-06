import React from "react";

const AppDetail = ({ appName, appDescription }) => {
  return (
    <div className="ml-6 text-white">
      <h1 className="text-[120px] font-bold">{appName}</h1>
      <span className="bg-white/20 px-2 py-1 rounded-md text-[15px] relative top-[-25px]  ">{appDescription}</span>
    </div>
  );
};

export default AppDetail;
