"use client";

import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Logs,
  Settings,
  CreditCard,
  Image,
  FileText,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Shield,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  IsLogin,
  Avatar,
  NickName,
  Email,
  Manager,
  store,
} from "@/data/base_data";
import LoginModal from "@/components/login-modal";
import LogoutModal from "@/components/logout-modal";

const menuItems = [
  {
    title: "管理员",
    href: "/dashboard/admin",
    icon: Shield,
    submenu: [
      {
        title: "兑换码",
        href: "/dashboard/admin/cdkey",
        icon: Key,
      },
    ],
  },
  {
    title: "仪表板",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "积分日志",
    href: "/dashboard/consumption-log",
    icon: Logs,
  },
  {
    title: "API Key",
    href: "/dashboard/api-keys",
    icon: Settings,
  },
  {
    title: "充值",
    href: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "文档/测试",
    href: "/dashboard/documents",
    icon: FileText,
    submenu: [
      {
        title: "openai api",
        href: "/dashboard/documents/chat",
        icon: Image,
      },
      {
        title: "4o Image",
        href: "/dashboard/documents/4o-image",
        icon: Image,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [nickName, setNickName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState("文档");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [manager, setManager] = useState(false);

  // Prefetch all routes on component mount
  useEffect(() => {
    // Prefetch all main menu routes
    menuItems.forEach((item) => {
      router.prefetch(item.href);
      // Prefetch submenu routes if any
      if (item.submenu) {
        item.submenu.forEach((subitem) => {
          router.prefetch(subitem.href);
        });
      }
    });

    // Initialize from store
    setIsLogin(store.get(IsLogin));
    setAvatar(store.get(Avatar));
    setNickName(store.get(NickName));
    setEmail(store.get(Email));

    // Subscribe to store changes
    const subIsLogin = store.sub(IsLogin, () => {
      setIsLogin(store.get(IsLogin));
    });
    const subAvatar = store.sub(Avatar, () => {
      setAvatar(store.get(Avatar));
    });
    const subNickName = store.sub(NickName, () => {
      setNickName(store.get(NickName));
    });
    const subEmail = store.sub(Email, () => {
      setEmail(store.get(Email));
    });
    const subManager = store.sub(Manager, () => {
      setManager(store.get(Manager));
    });

    // Set open submenu based on current path
    menuItems.forEach((item) => {
      if (
        item.submenu &&
        item.submenu.some(
          (subitem) =>
            pathname === subitem.href || pathname.startsWith(`${subitem.href}/`)
        )
      ) {
        setOpenSubmenu(item.title);
      }
    });

    return () => {
      // Unsubscribe when component unmounts
      subIsLogin();
      subAvatar();
      subNickName();
      subEmail();
      subManager();
    };
  }, [pathname, router]);

  const handleUserClick = () => {
    if (!isLogin) {
      setIsLoginModalOpen(true);
    } else {
      setIsLogoutModalOpen(true);
    }
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
  };

  const closeLogoutModal = () => {
    setIsLogoutModalOpen(false);
  };

  const toggleSubmenu = (title) => {
    setOpenSubmenu(openSubmenu === title ? "" : title);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile menu button - visible only on small screens */}
      <button
        onClick={toggleMobileMenu}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-white dark:bg-gray-800 shadow-md"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5 text-gray-600 dark:text-gray-200" />
        ) : (
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-200" />
        )}
      </button>

      {/* Sidebar - hidden on mobile unless toggled */}
      <div
        className={cn(
          "w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col z-40 transition-all duration-300 ease-in-out",
          "fixed lg:relative", // Fixed on mobile, relative on desktop
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0" // Hidden on mobile by default
        )}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
          <img src="/images/logo.png" alt="GrsAI API" className="w-8 h-8" />
          <h2 className="text-xl font-bold">GrsAI API</h2>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto relative z-20">
          {menuItems.map((item) => {
            // Skip admin menu item if user is not a manager
            if (item.href === "/dashboard/admin" && !manager) {
              return null;
            }

            const isActive =
              pathname === item.href ||
              (pathname.startsWith(`${item.href}/`) &&
                item.href !== "/dashboard") ||
              (item.submenu &&
                item.submenu.some(
                  (subitem) =>
                    pathname === subitem.href ||
                    pathname.startsWith(`${subitem.href}/`)
                ));
            const Icon = item.icon;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuOpen = openSubmenu === item.title;

            return (
              <div key={item.href}>
                {hasSubmenu ? (
                  <div
                    className={cn(
                      "w-full cursor-pointer flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all relative z-20 text-left",
                      isActive
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50"
                    )}
                    onClick={() => toggleSubmenu(item.title)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.title}</span>
                    {isSubmenuOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                ) : (
                  <Link
                    href={
                      item.href === "/dashboard"
                        ? item.href
                        : isLogin
                        ? item.href
                        : ""
                    }
                    onClick={(e) => {
                      if (!isLogin && item.href !== "/dashboard") {
                        e.preventDefault();
                        setIsLoginModalOpen(true);
                      }
                    }}
                    className={cn(
                      "w-full cursor-pointer flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all relative z-20 text-left",
                      isActive
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1">{item.title}</span>
                  </Link>
                )}

                {/* Submenu */}
                {hasSubmenu && isSubmenuOpen && (
                  <div className="ml-4 mt-1 space-y-1">
                    {item.submenu.map((subitem) => {
                      const isSubActive =
                        pathname === subitem.href ||
                        pathname.startsWith(`${subitem.href}/`);
                      const SubIcon = subitem.icon;

                      return (
                        <Link
                          key={subitem.href}
                          href={isLogin ? subitem.href : ""}
                          className={cn(
                            "w-full cursor-pointer flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all relative z-20 text-left",
                            isSubActive
                              ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50"
                              : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-50"
                          )}
                          onClick={(e) => {
                            if (!isLogin) {
                              e.preventDefault();
                              setIsLoginModalOpen(true);
                            }
                          }}
                        >
                          <SubIcon className="h-4 w-4" />
                          {subitem.title}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div
          className="p-4 border-t border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={handleUserClick}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              {isLogin && avatar ? (
                <img
                  src={avatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : isLogin && nickName ? (
                <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                  {nickName.charAt(0).toUpperCase()}
                </div>
              ) : null}
            </div>
            <div>
              <p className="text-sm font-medium">
                {isLogin ? nickName : "未登录"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isLogin ? email : "点击登录"}
              </p>
            </div>
          </div>
        </div>

        {/* Login Modal */}
        <LoginModal isOpen={isLoginModalOpen} onClose={closeLoginModal} />

        {/* Logout Modal */}
        {isLogoutModalOpen && (
          <LogoutModal isOpen={isLogoutModalOpen} onClose={closeLogoutModal} />
        )}
      </div>

      {/* Overlay to close mobile menu when clicking outside */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
}
