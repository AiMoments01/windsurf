'use client';

import { Fragment, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  CalendarIcon,
  UserGroupIcon,
  AcademicCapIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from '@/context/ThemeContext';
import { safeQueryTable } from '@/utils/database-helpers';
import { Database } from '@/types/supabase';

// Definieren eines Typs für ein Profil
type Profile = Database['public']['Tables']['profiles']['Row'];

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Kalender', href: '/calendar', icon: CalendarIcon },
  { name: 'Patienten', href: '/patients', icon: UserGroupIcon },
  { name: 'Kurse', href: '/courses', icon: AcademicCapIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Navigation() {
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  
  // Direktes Erstellen des Supabase-Clients (temporäre Lösung)
  const [supabase] = useState(() => 
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  useEffect(() => {
    // Prüfe den Authentifizierungsstatus beim Laden
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthenticated(!!data.session);
        if (data.session?.user) {
          setUserName(data.session.user.email || null);
          
          // Versuche, zusätzliche Benutzerdaten aus der Profiles-Tabelle zu laden
          // Benutzt die sichere Abfragemethode, die Fehler bei fehlenden Tabellen abfängt
          if (data.session.user.id) {
            const { data: profileData } = await safeQueryTable<Profile | null>(
              supabase,
              'profiles',
              query => query.select('*').eq('id', data.session!.user.id).single(),
              null // Kein Fallback-Wert nötig, wir verwenden bereits die E-Mail aus der Auth-Session
            );
            
            // Wenn Profildaten vorhanden sind und ein Name gesetzt ist, verwenden wir diesen
            if (profileData && profileData.full_name) {
              setUserName(profileData.full_name);
            }
          }
        }
      } catch (error) {
        console.error("Fehler beim Prüfen des Auth-Status:", error);
      }
    };
    
    checkAuth();

    // Abonniere Änderungen am Auth-Status
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth-Statusänderung:", event, !!session);
        setIsAuthenticated(!!session);
        
        if (session?.user) {
          setUserName(session.user.email || null);
          
          // Versuche, zusätzliche Benutzerdaten zu laden, wie oben
          try {
            const { data: profileData } = await safeQueryTable<Profile | null>(
              supabase,
              'profiles',
              query => query.select('*').eq('id', session.user.id).single(),
              null
            );
            
            if (profileData && profileData.full_name) {
              setUserName(profileData.full_name);
            }
          } catch (error) {
            console.error("Fehler beim Laden der Profildaten:", error);
          }
        } else {
          setUserName(null);
        }
      }
    );

    // Aufräumen beim Unmount
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <Disclosure as="nav" className="bg-white dark:bg-dark-card shadow-sm border-b border-gray-200 dark:border-dark-border">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <span className="text-xl font-bold text-primary dark:text-blue-400">Rehasport</span>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        pathname === item.href
                          ? 'border-primary text-gray-900 dark:text-gray-100'
                          : 'border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-gray-200',
                        'inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium'
                      )}
                    >
                      {item.icon && (
                        <item.icon className="mr-1.5 h-5 w-5" aria-hidden="true" />
                      )}
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-3">
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleTheme}
                  className="theme-toggle"
                  aria-label={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
                >
                  {theme === 'dark' ? (
                    <SunIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <MoonIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>

                {/* Profil-Dropdown */}
                {isAuthenticated ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-full bg-white dark:bg-dark-hover text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                        <span className="sr-only">Benutzermenü öffnen</span>
                        <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-dark-card dark:border dark:border-dark-border py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="border-b border-gray-100 dark:border-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
                          <p className="font-medium truncate">{userName}</p>
                        </div>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/profile"
                              className={classNames(
                                active ? 'bg-gray-100 dark:bg-dark-hover' : '',
                                'block px-4 py-2 text-sm text-gray-700 dark:text-gray-300'
                              )}
                            >
                              Profil
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={handleSignOut}
                              className={classNames(
                                active ? 'bg-gray-100 dark:bg-dark-hover' : '',
                                'block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300'
                              )}
                            >
                              Abmelden
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <Link
                    href="/auth"
                    className="inline-flex items-center rounded-md border border-transparent bg-primary px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                  >
                    Anmelden
                  </Link>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                {/* Dark Mode Toggle (Mobile) */}
                <button
                  onClick={toggleTheme}
                  className="theme-toggle mr-2"
                  aria-label={theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
                >
                  {theme === 'dark' ? (
                    <SunIcon className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <MoonIcon className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>

                {/* Mobile menu button */}
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-dark-hover dark:hover:text-gray-200">
                  <span className="sr-only">Menü öffnen</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className={classNames(
                    pathname === item.href
                      ? 'bg-primary/10 border-primary text-primary dark:bg-blue-900/30 dark:text-blue-400'
                      : 'border-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover hover:border-gray-300 hover:text-gray-800',
                    'block border-l-4 py-2 pl-3 pr-4 text-base font-medium'
                  )}
                >
                  <div className="flex items-center">
                    {item.icon && (
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                    )}
                    {item.name}
                  </div>
                </Disclosure.Button>
              ))}
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 pb-3 pt-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center px-4">
                    <div className="flex-shrink-0">
                      <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-300" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800 dark:text-gray-200">{userName || 'Benutzer'}</div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    <Disclosure.Button
                      as="a"
                      href="/profile"
                      className="block px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover hover:text-gray-800"
                    >
                      Profil
                    </Disclosure.Button>
                    <Disclosure.Button
                      as="button"
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-hover hover:text-gray-800"
                    >
                      Abmelden
                    </Disclosure.Button>
                  </div>
                </>
              ) : (
                <div className="mt-3 space-y-1 px-2">
                  <Disclosure.Button
                    as="a"
                    href="/auth"
                    className="block rounded-md px-3 py-2 text-base font-medium text-white bg-primary hover:bg-primary-dark"
                  >
                    Anmelden
                  </Disclosure.Button>
                </div>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
