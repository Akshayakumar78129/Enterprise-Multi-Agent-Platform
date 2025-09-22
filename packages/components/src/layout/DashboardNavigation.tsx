"use client";

import React, { useState } from "react";
import { DASHBOARDS, DASHBOARD_DOMAINS } from "constants/dashboards";
import { Button } from "../ui/Button";

interface DashboardNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  className?: string;
}

export const DashboardNavigation: React.FC<DashboardNavigationProps> = ({
  currentPath,
  onNavigate,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDashboards = DASHBOARDS.filter(dashboard => {
    const matchesDomain = !selectedDomain || dashboard.domain === selectedDomain;
    const matchesSearch = !searchQuery ||
      dashboard.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dashboard.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  const groupedDashboards = DASHBOARD_DOMAINS.map(domain => ({
    ...domain,
    dashboards: filteredDashboards.filter(d => d.domain === domain.id),
  })).filter(domain => domain.dashboards.length > 0);

  return (
    <>
      {/* Navigation Toggle Button */}
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </Button>

      {/* Navigation Drawer */}
      {isOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer */}
          <div className={`fixed left-0 top-0 h-full w-80 bg-surface border-r border-border z-50 overflow-y-auto ${className}`}>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-foreground">Thoughtlets</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search thoughtlets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              {/* Domain Filters removed as per request */}

              {/* Dashboard List */}
              <div className="space-y-6">
                {groupedDashboards.map(domain => (
                  <div key={domain.id}>
                    <h3 className="text-sm font-semibold text-muted mb-2 uppercase">
                      {domain.name}
                    </h3>
                    <div className="space-y-1">
                      {domain.dashboards.map(dashboard => (
                        <button
                          key={dashboard.id}
                          onClick={() => {
                            onNavigate(dashboard.path);
                            setIsOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                            currentPath === dashboard.path
                              ? 'bg-accent text-background'
                              : 'hover:bg-surface text-foreground'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{dashboard.name}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {filteredDashboards.length === 0 && (
                <div className="text-center text-muted py-8">
                  No dashboards found
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

interface MegaMenuProps {
  className?: string;
}

export const DashboardMegaMenu: React.FC<MegaMenuProps> = ({ className = "" }) => {
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-1 p-2 bg-surface rounded-lg border border-border">
        {DASHBOARD_DOMAINS.map(domain => (
          <div
            key={domain.id}
            onMouseEnter={() => setHoveredDomain(domain.id)}
            onMouseLeave={() => setHoveredDomain(null)}
            className="relative"
          >
            <Button variant="ghost" className="flex items-center gap-2">
              <span className={domain.color}>{domain.icon}</span>
              <span>{domain.name}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>

            {hoveredDomain === domain.id && (
              <div className="absolute top-full left-0 mt-2 w-96 bg-surface border border-border rounded-lg shadow-neo p-4 z-50">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {domain.icon} {domain.name} Thoughtlets
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {DASHBOARDS.filter(d => d.domain === domain.id).map(dashboard => (
                    <a
                      key={dashboard.id}
                      href={dashboard.path}
                      className="block p-3 rounded-lg hover:bg-background transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span>{dashboard.icon}</span>
                        <span className="font-medium text-sm">{dashboard.name}</span>
                      </div>
                      <p className="text-xs text-muted">{dashboard.description}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};