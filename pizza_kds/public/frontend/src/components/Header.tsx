import React from "react";
import BellIcon from "./icons/BellIcon";

interface HeaderProps {
  user?: string;
  role?: string;
}

const Header: React.FC<HeaderProps> = ({
  user = "Stephany Lorean",
  role = "Cashier",
}) => {
  // Matching the "Monday, April 7th, 2025" style from image
  const today = "Monday, April 7th, 2025";

  return (
    <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6  bg-white px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-5 lg:px-4 lg:pb-2 lg:pt-6">
      {/* Left Section: Greeting and Date */}
      <div className="flex flex-col gap-0.5 sm:gap-1 min-w-0 flex-1">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-2xl font-medium text-olive-700 leading-tight break-words">
          Hi, {user.split(" ")[0]}, <span className="block sm:inline">here's today's orders!</span>
        </h1>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg font-normal text-brand-gray truncate">{today}</p>
      </div>

      {/* Right Section: Actions and Profile */}
      <div className="flex items-center gap-3 sm:gap-4 lg:gap-4 flex-wrap lg:flex-nowrap justify-between lg:justify-end w-full lg:w-auto">
        {/* Notification Bell */}
        <div className="relative flex items-center justify-center rounded-full bg-emerald-50 p-2 sm:p-3 text-brand-green cursor-pointer hover:bg-emerald-100 transition-colors flex-shrink-0">
          <BellIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-9.5 lg:w-9.5" />
          <span className="absolute right-0 top-0 flex h-4 w-4 sm:h-4.5 sm:w-4.5 items-center justify-center rounded-full border-2 border-white bg-red-400 text-xs font-bold text-white leading-none">
            2
          </span>
        </div>

        {/* User Profile Info */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Profile Avatar */}
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-17 lg:w-17 items-center justify-center overflow-hidden rounded-full bg-emerald-100 border border-olive-200 flex-shrink-0">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Stephany"
              alt="user"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <p className="mb-0.5 sm:mb-1 text-xs sm:text-sm md:text-base lg:text-lg font-normal leading-tight text-brand-gray truncate">
              Hi, I'm a <span className="text-brand-gray font-medium">{role}</span>
            </p>
            <p className="text-sm sm:text-base md:text-lg lg:text-2xl font-medium leading-tight text-olive-700 truncate">
              {user.split(" ")[0]}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
