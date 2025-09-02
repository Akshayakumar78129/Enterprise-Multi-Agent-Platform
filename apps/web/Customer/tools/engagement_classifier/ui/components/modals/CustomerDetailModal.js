import React, { useState, useMemo } from "react";

const CustomerDetailModal = ({ 
  isOpen, 
  onClose, 
  customers = [], 
  engagementLevel = null,
  title = "Customer Details" 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('LTD Sales Amount');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const customersPerPage = 10;

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers;

    // Apply search filter
    if (searchTerm) {
      filtered = customers.filter(customer => 
        customer["Customer Name"]?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer["Customer Number"]?.toString().includes(searchTerm)
      );
    }

    // Sort customers
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || 0;
      let bVal = b[sortBy] || 0;
      
      // Handle string sorting
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      // Handle numeric sorting
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return filtered;
  }, [customers, searchTerm, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const paginatedCustomers = filteredAndSortedCustomers.slice(startIndex, startIndex + customersPerPage);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    if (filteredAndSortedCustomers.length === 0) return null;

    const totalCustomers = filteredAndSortedCustomers.length;
    const totalLTV = filteredAndSortedCustomers.reduce((sum, c) => sum + (c["LTD Sales Amount"] || 0), 0);
    const avgLTV = totalLTV / totalCustomers;
    const avgTransactions = filteredAndSortedCustomers.reduce((sum, c) => sum + (c["Number Sales Txns"] || 0), 0) / totalCustomers;
    const avgDaysSinceActivity = filteredAndSortedCustomers.reduce((sum, c) => sum + (c["Days Since Last Activity"] || 0), 0) / totalCustomers;
    const avgRFMScore = filteredAndSortedCustomers.reduce((sum, c) => sum + (c["RFM Score"] || 0), 0) / totalCustomers;

    return {
      totalCustomers,
      totalLTV,
      avgLTV,
      avgTransactions,
      avgDaysSinceActivity,
      avgRFMScore
    };
  }, [filteredAndSortedCustomers]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEngagementColor = (level) => {
    switch (level) {
      case 'High': return '#00e0ff';
      case 'Medium': return '#5fd4d6';
      case 'Low': return '#e930ff';
      default: return '#5891cb';
    }
  };

  const handleCustomerAction = (customer, action) => {
    console.log(`${action} action for customer:`, customer["Customer Name"]);
    // Here you would integrate with your CRM/email system
    alert(`${action} action initiated for ${customer["Customer Name"]}`);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.8)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div style={{
        backgroundColor: "#0a1224",
        borderRadius: "16px",
        border: "1px solid #3a4459",
        width: "90%",
        maxWidth: "1200px",
        maxHeight: "90vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        
        {/* Modal Header */}
        <div style={{
          padding: "24px",
          borderBottom: "1px solid #3a4459",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <h2 style={{
              color: "#00e0ff",
              margin: 0,
              fontSize: "24px",
              fontWeight: "600"
            }}>
              {title}
              {engagementLevel && (
                <span style={{
                  color: getEngagementColor(engagementLevel),
                  marginLeft: "12px",
                  fontSize: "20px"
                }}>
                  ({engagementLevel} Engagement)
                </span>
              )}
            </h2>
            <p style={{
              color: "#5891cb",
              margin: "4px 0 0 0",
              fontSize: "14px"
            }}>
              {filteredAndSortedCustomers.length} customers found
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#5891cb",
              fontSize: "24px",
              cursor: "pointer",
              padding: "8px"
            }}
          >
            ✕
          </button>
        </div>

        {/* Summary Stats */}
        {summaryStats && (
          <div style={{
            padding: "20px 24px",
            backgroundColor: "#232a36",
            borderBottom: "1px solid #3a4459"
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "20px"
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "600", color: "#00e0ff" }}>
                  {summaryStats.totalCustomers.toLocaleString()}
                </div>
                <div style={{ fontSize: "12px", color: "#5891cb" }}>Total Customers</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "600", color: "#00e0ff" }}>
                  {formatCurrency(summaryStats.totalLTV)}
                </div>
                <div style={{ fontSize: "12px", color: "#5891cb" }}>Total LTV</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "600", color: "#00e0ff" }}>
                  {formatCurrency(summaryStats.avgLTV)}
                </div>
                <div style={{ fontSize: "12px", color: "#5891cb" }}>Avg LTV</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "600", color: "#00e0ff" }}>
                  {Math.round(summaryStats.avgTransactions)}
                </div>
                <div style={{ fontSize: "12px", color: "#5891cb" }}>Avg Transactions</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "600", color: "#00e0ff" }}>
                  {Math.round(summaryStats.avgDaysSinceActivity)}
                </div>
                <div style={{ fontSize: "12px", color: "#5891cb" }}>Avg Days Since Activity</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: "600", color: "#00e0ff" }}>
                  {summaryStats.avgRFMScore.toFixed(1)}
                </div>
                <div style={{ fontSize: "12px", color: "#5891cb" }}>Avg RFM Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div style={{
          padding: "16px 24px",
          borderBottom: "1px solid #3a4459",
          display: "flex",
          gap: "16px",
          alignItems: "center",
          flexWrap: "wrap"
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: "8px 12px",
              backgroundColor: "#1a1f2e",
              border: "1px solid #3a4459",
              borderRadius: "6px",
              color: "#f7f9fb",
              fontSize: "14px",
              minWidth: "200px"
            }}
          />

          {/* Sort Controls */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: "8px 12px",
              backgroundColor: "#1a1f2e",
              border: "1px solid #3a4459",
              borderRadius: "6px",
              color: "#f7f9fb",
              fontSize: "14px"
            }}
          >
            <option value="LTD Sales Amount">Sort by LTV</option>
            <option value="RFM Score">Sort by RFM Score</option>
            <option value="Days Since Last Activity">Sort by Last Activity</option>
            <option value="Number Sales Txns">Sort by Transactions</option>
            <option value="Customer Name">Sort by Name</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            style={{
              padding: "8px 12px",
              backgroundColor: "#232a36",
              border: "1px solid #3a4459",
              borderRadius: "6px",
              color: "#f7f9fb",
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </button>
        </div>

        {/* Customer List */}
        <div style={{
          flex: 1,
          overflow: "auto",
          padding: "0 24px"
        }}>
          {paginatedCustomers.map((customer, index) => (
            <div
              key={customer["Customer Key"] || index}
              style={{
                padding: "16px",
                borderBottom: "1px solid #3a4459",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: index % 2 === 0 ? "#0f1419" : "transparent"
              }}
            >
              {/* Customer Info */}
              <div style={{ flex: 1 }}>
                {/* Customer Header */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "16px",
                  padding: "12px",
                  backgroundColor: "#1a1f2e",
                  borderRadius: "8px",
                  border: "1px solid #3a4459"
                }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{
                      color: "#f7f9fb",
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: "600",
                      marginBottom: "4px"
                    }}>
                      {customer["Customer Name"] || 'Unknown Customer'}
                    </h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{
                        color: "#5891cb",
                        fontSize: "14px"
                      }}>
                        Customer #{customer["Customer Number"]}
                      </span>
                      <span style={{
                        backgroundColor: getEngagementColor(customer.engagement_level),
                        color: "#000",
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        {customer.engagement_level} Engagement
                      </span>
                      <span style={{
                        backgroundColor: customer["Loyalty Status"] === 'Active, Loyal' ? '#00e0ff' : 
                                       customer["Loyalty Status"] === 'Active' ? '#5fd4d6' : 
                                       customer["Loyalty Status"] === 'Inactive' ? '#e930ff' : '#5891cb',
                        color: "#000",
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: "600"
                      }}>
                        {customer["Loyalty Status"] || 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Customer Metrics Grid */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "16px",
                  marginBottom: "16px"
                }}>
                  {/* Financial Metrics */}
                  <div style={{
                    padding: "16px",
                    backgroundColor: "#232a36",
                    borderRadius: "8px",
                    border: "1px solid #3a4459"
                  }}>
                    <h5 style={{
                      color: "#00e0ff",
                      margin: "0 0 12px 0",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>
                      💰 Financial
                    </h5>
                    <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ color: "#5891cb" }}>Lifetime Value:</span><br/>
                        <span style={{ color: "#f7f9fb", fontWeight: "600", fontSize: "16px" }}>
                          {formatCurrency(customer["LTD Sales Amount"])}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#5891cb" }}>Avg Purchase:</span><br/>
                        <span style={{ color: "#f7f9fb", fontWeight: "600" }}>
                          {formatCurrency(customer["Avg Sales Amount"])}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Metrics */}
                  <div style={{
                    padding: "16px",
                    backgroundColor: "#232a36",
                    borderRadius: "8px",
                    border: "1px solid #3a4459"
                  }}>
                    <h5 style={{
                      color: "#5fd4d6",
                      margin: "0 0 12px 0",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>
                      📊 Activity
                    </h5>
                    <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ color: "#5891cb" }}>Transactions:</span><br/>
                        <span style={{ color: "#f7f9fb", fontWeight: "600", fontSize: "16px" }}>
                          {customer["Number Sales Txns"] || 0}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#5891cb" }}>Last Activity:</span><br/>
                        <span style={{ color: "#f7f9fb", fontWeight: "600" }}>
                          {customer["Days Since Last Activity"]} days ago
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RFM Metrics */}
                  <div style={{
                    padding: "16px",
                    backgroundColor: "#232a36",
                    borderRadius: "8px",
                    border: "1px solid #3a4459"
                  }}>
                    <h5 style={{
                      color: "#e930ff",
                      margin: "0 0 12px 0",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>
                      🎯 RFM Analysis
                    </h5>
                    <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <span style={{ color: "#5891cb" }}>RFM Score:</span><br/>
                        <span style={{ color: "#f7f9fb", fontWeight: "600", fontSize: "16px" }}>
                          {customer["RFM Score"]?.toFixed(1) || 'N/A'}/10
                        </span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", fontSize: "11px" }}>
                        <span style={{ 
                          backgroundColor: "#1a1f2e", 
                          padding: "2px 6px", 
                          borderRadius: "4px",
                          color: "#f7f9fb"
                        }}>
                          R: {customer["Recency Band"] || 'N/A'}
                        </span>
                        <span style={{ 
                          backgroundColor: "#1a1f2e", 
                          padding: "2px 6px", 
                          borderRadius: "4px",
                          color: "#f7f9fb"
                        }}>
                          F: {customer["Frequency Band"] || 'N/A'}
                        </span>
                        <span style={{ 
                          backgroundColor: "#1a1f2e", 
                          padding: "2px 6px", 
                          borderRadius: "4px",
                          color: "#f7f9fb"
                        }}>
                          M: {customer["Monetary Band"] || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {(customer["First Activity Date"] || customer["Last Activity Date"]) && (
                  <div style={{
                    padding: "12px",
                    backgroundColor: "#1a1f2e",
                    borderRadius: "6px",
                    border: "1px solid #3a4459",
                    fontSize: "13px"
                  }}>
                    <div style={{ display: "flex", gap: "24px" }}>
                      {customer["First Activity Date"] && (
                        <div>
                          <span style={{ color: "#5891cb" }}>First Activity: </span>
                          <span style={{ color: "#f7f9fb", fontWeight: "500" }}>
                            {formatDate(customer["First Activity Date"])}
                          </span>
                        </div>
                      )}
                      {customer["Last Activity Date"] && (
                        <div>
                          <span style={{ color: "#5891cb" }}>Last Activity: </span>
                          <span style={{ color: "#f7f9fb", fontWeight: "500" }}>
                            {formatDate(customer["Last Activity Date"])}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{
                display: "flex",
                gap: "8px",
                marginLeft: "16px"
              }}>
                <button
                  onClick={() => handleCustomerAction(customer, 'Email')}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#00e0ff",
                    color: "#000",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                  title="Send Email"
                >
                  📧
                </button>
                <button
                  onClick={() => handleCustomerAction(customer, 'Call')}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#5fd4d6",
                    color: "#000",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                  title="Schedule Call"
                >
                  📞
                </button>
                <button
                  onClick={() => handleCustomerAction(customer, 'Campaign')}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#e930ff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                  title="Add to Campaign"
                >
                  🎯
                </button>
                <button
                  onClick={() => handleCustomerAction(customer, 'Profile')}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#232a36",
                    color: "#f7f9fb",
                    border: "1px solid #3a4459",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                  title="View Full Profile"
                >
                  📊
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: "16px 24px",
            borderTop: "1px solid #3a4459",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "8px"
          }}>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px",
                backgroundColor: currentPage === 1 ? "#1a1f2e" : "#232a36",
                color: currentPage === 1 ? "#5891cb" : "#f7f9fb",
                border: "1px solid #3a4459",
                borderRadius: "6px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer"
              }}
            >
              ← Previous
            </button>
            
            <span style={{ color: "#5891cb", fontSize: "14px" }}>
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px",
                backgroundColor: currentPage === totalPages ? "#1a1f2e" : "#232a36",
                color: currentPage === totalPages ? "#5891cb" : "#f7f9fb",
                border: "1px solid #3a4459",
                borderRadius: "6px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer"
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDetailModal;