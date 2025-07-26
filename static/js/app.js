// GST Return Tracking System - Main Application JavaScript

let currentReturnType = null;
let currentPeriod = null;
let returnClientsData = [];

// Helper to get the current date (or override for testing)
function getToday() {
    // You can change to: return new Date("2025-07-20"); for testing
    return new Date();
}

// Helper for financial year ending March (India):
function getFinancialYear(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JS months are 0-based
    return (month >= 4) ?
        `${year}-${String(year + 1).slice(-2)}` :
        `${year - 1}-${String(year).slice(-2)}`;
}

// Helper to get previous month as full name ("June"), and handle FY wrap
function getPreviousMonthAndFY(date) {
    let prevMonth = date.getMonth(); // 0 = Jan, so this gives "previous"
    let prevYearDate = new Date(date);
    if (prevMonth === 0) { // January: go to Dec previous year
        prevMonth = 11;
        prevYearDate.setFullYear(prevYearDate.getFullYear() - 1);
    } else {
        prevMonth -= 1;
    }
    // List of month names as per dropdown
    const months = [
        "Jan", "Feb", "Mar",
        "Apr", "May", "Jun",
        "Jul", "Aug", "Sep",
        "Oct", "Nov", "Dec"
    ];
    return {
        name: months[prevMonth],
        fy: getFinancialYear(prevYearDate)
    };
}

// Helper to get previous quarter and relevant FY
function getPreviousQuarterAndFY(date) {
    // Quarter mapping: 1=Apr-Jun, 2=Jul-Sep, 3=Oct-Dec, 4=Jan-Mar
    const quarters = [
        "Apr-Jun", "Jul-Sep", "Oct-Dec", "Jan-Mar"
    ];
    const month = date.getMonth() + 1; // 1-12
    let quarterIndex;
    let quarterStartMonth;
    if (month >= 4 && month <= 6) {      // Apr-Jun → Q1
        quarterIndex = 0;
        quarterStartMonth = 4;
    } else if (month >= 7 && month <= 9) { // Jul-Sep → Q2
        quarterIndex = 1;
        quarterStartMonth = 7;
    } else if (month >= 10 && month <= 12) { // Oct-Dec → Q3
        quarterIndex = 2;
        quarterStartMonth = 10;
    } else { // Jan-Mar → Q4
        quarterIndex = 3;
        quarterStartMonth = 1;
    }
    // Move to previous quarter
    let prevQuarterIndex = quarterIndex - 1;
    let prevFYDate = new Date(date);
    if (prevQuarterIndex < 0) {
        prevQuarterIndex = 3;
        prevFYDate.setFullYear(prevFYDate.getFullYear() - 1);
    }
    return {
        name: quarters[prevQuarterIndex],
        fy: getFinancialYear(
            new Date(prevFYDate.getFullYear(), [3, 6, 9, 0][prevQuarterIndex], 1)
        )
    };
}

// Helper for annual: always previous financial year
function getPreviousFinancialYear(date) {
    return getFinancialYear(new Date(date.getFullYear() - 1, date.getMonth(), date.getDate()));
}

// Main default setting logic
function setGstReturnDropdownDefaults() {
    const freqSel = document.getElementById('frequency');
    const fySel = document.getElementById('financial_year');
    const monthSel = document.getElementById('month');
    const quarterSel = document.getElementById('quarter');
    if (!freqSel || !fySel) return;

    const now = getToday();

    freqSel.addEventListener('change', function() {
        if (this.value === "Monthly") {
            const {name, fy} = getPreviousMonthAndFY(now);
            // Set FY
            [...fySel.options].forEach(opt => {
                opt.selected = (opt.value === fy);
            });
            // Set Month
            if (monthSel) {
                [...monthSel.options].forEach(opt => {
                    opt.selected = (opt.value === name);
                });
            }
        } else if (this.value === "Quarterly") {
            const {name, fy} = getPreviousQuarterAndFY(now);
            // Set FY
            [...fySel.options].forEach(opt => {
                opt.selected = (opt.value === fy);
            });
            // Set Quarter
            if (quarterSel) {
                [...quarterSel.options].forEach(opt => {
                    opt.selected = (opt.value === name);
                });
            }
        } else if (this.value === "Annually") {
            // Set FY to previous financial year
            const prevFY = getPreviousFinancialYear(now);
            [...fySel.options].forEach(opt => {
                opt.selected = (opt.value === prevFY);
            });
        }
    });

    // On first load, try to select defaults if "Monthly" or "Quarterly"
    if (freqSel.value === "Monthly" || freqSel.value === "Quarterly" || freqSel.value === "Annually") {
        freqSel.dispatchEvent(new Event('change'));
    }
}

// Call this after dropdowns are rendered (on DOMContentLoaded)
document.addEventListener('DOMContentLoaded', setGstReturnDropdownDefaults);



document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/*
document.addEventListener('DOMContentLoaded', () => {
	// Enhance dropdown with Select2
  $('#statusFilter').select2({
    placeholder: 'Select Statuses',
    width: '100%',
    closeOnSelect: false,
	dropdownParent: $('#returnDetailsModal')
  });

  // Status filter change
  $('#statusFilter').on('change', filterGridByStatus);

  // Clear filters
  $('#clearStatusFilter').on('click', function () {
    $('#statusFilter').val(null).trigger('change');
    filterGridByStatus();
  });
  
  const returnModal = document.getElementById('returnDetailsModal');

    if (returnModal) {
        returnModal.addEventListener('hidden.bs.modal', function () {
            // Force cleanup of unwanted state
            $('.modal-backdrop').remove();
            $('body').removeClass('modal-open');
            $('body').css('padding-right', '');

            // Optionally reset dropdown etc.
            if ($('#statusFilter').hasClass("select2-hidden-accessible")) {
                $('#statusFilter').select2('destroy');
            }
            $('#statusFilter').val(null);
        });
    }
});
*/


/*
document.addEventListener('DOMContentLoaded', function () {
  const $modal = $('#returnDetailsModal');
  const $statusSelect = $('#statusFilter');
  const $clearBtn = $('#clearStatusFilter');

  let select2Initialized = false;

  // 🧹 Cleanup on modal close
  $modal.on('hidden.bs.modal', function () {
    if ($statusSelect.hasClass('select2-hidden-accessible')) {
      $statusSelect.select2('destroy');
    }
    select2Initialized = false;

    // Remove lingering backdrops
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open').css('padding-right', '');
  });

  // ✅ Safe re-initialization ONCE per modal open
  $modal.on('shown.bs.modal', function () {
    if (!select2Initialized) {
      
	  $statusSelect.select2({
		  placeholder: 'Select statuses',
		  width: '100%',
		  closeOnSelect: false,
		  dropdownParent: $modal,
		  templateResult: function (option) {
			if (!option.id) return option.text;

			const selectedValues = $statusSelect.val() || [];
			const isSelected = selectedValues.includes(option.id);

			return $(`
			  <div class="d-flex align-items-center">
				<span class="me-2">${isSelected ? '✅' : '⬜'}</span>
				<span>${option.text}</span>
			  </div>
			`);
		  },
		  templateSelection: function (option) {
			return option.text;
		  },
		  escapeMarkup: function (m) {
			return m;
		  }
		});


      // Pre-select default statuses (excluding "Filed")
      const defaultStatuses = [
        'Data Received',
        'Saved',
        'Payment Issued',
        'Submitted'
      ];
      $statusSelect.val(defaultStatuses).trigger('change');

      select2Initialized = true;
    }
  });

  // 🧠 Filtering Logic
  $statusSelect.on('change', filterGridByStatus);

  // Clear Button
  $clearBtn.on('click', function () {
    $statusSelect.val(null).trigger('change');
    filterGridByStatus();
  });
});
*/

document.addEventListener('DOMContentLoaded', function () {
  const $modal = $('#returnDetailsModal');
  const $statusSelect = $('#statusFilter');
  const $clearBtn = $('#clearStatusFilter');

  let select2Initialized = false;

  // Initialize Select2 with checkbox-like icons (not actual input checkboxes)
  function initStatusSelect() {
    $statusSelect.select2({
      placeholder: 'Select Status',
      width: '100%',
      closeOnSelect: false,
      dropdownParent: $modal,
      templateResult: function (option) {
        if (!option.id) return option.text;
        const selectedValues = $statusSelect.val() || [];
        const isSelected = selectedValues.includes(option.id);
        // Use Unicode checkbox glyphs or FontAwesome icons below:
        return $(`
          <div class="d-flex align-items-center">
            <span>${option.text}</span>
          </div>
        `);
      },
      templateSelection: function (option) {
        return option.text;
      },
      escapeMarkup: function (m) {
        return m;
      }
    });
  }

  // Cleanup on modal close to fix scroll lock and stuck background issue
  $modal.on('hidden.bs.modal', function () {
    if ($statusSelect.hasClass('select2-hidden-accessible')) {
      $statusSelect.select2('destroy');
    }
    select2Initialized = false;
    // Remove all modal backdrops and modal-open class from body
    $('.modal-backdrop').remove();
    $('body').removeClass('modal-open').css('padding-right', '');

    // Optional: Re-enable scroll on body forcibly
    $('body').css('overflow', 'auto');
  });

  // Initialize Select2 once per modal open
  $modal.on('shown.bs.modal', function () {
    if (!select2Initialized) {
      initStatusSelect();
      // Pre-select all statuses except 'Filed'
      const defaultStatuses = [
        'Data Received',
        'Saved',
        'Payment Issued',
        'Submitted'
      ];
      $statusSelect.val(defaultStatuses).trigger('change');
      select2Initialized = true;
    }
  });

  // Filter grid when selection changes
  $statusSelect.on('change', filterGridByStatus);

  // Clear filters
  $clearBtn.on('click', function () {
    $statusSelect.val(null).trigger('change');
    filterGridByStatus();
  });
});

function filterGridByStatus() {
  const selectedStatuses = $('#statusFilter').val();  // Array or null
  const filtered = (!selectedStatuses || selectedStatuses.length === 0)
    ? returnClientsData
    : returnClientsData.filter(client => selectedStatuses.includes(client.status));

  displayReturnDetails(currentReturnType, currentPeriod, filtered);
}


function initializeApp() {
    // Tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    enableFormValidation();
    setupEventListeners();
}

function enableFormValidation() {
    const forms = document.querySelectorAll('.needs-validation');
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
}

function setupEventListeners() {
    const returnDashboardForm = document.getElementById('returnDashboardForm');
    if (returnDashboardForm) {
        returnDashboardForm.addEventListener('submit', handleReturnDashboard);
    }

    const frequencySelect = document.getElementById('frequency');
    if (frequencySelect) {
        frequencySelect.addEventListener('change', handleFrequencyChange);
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', handleStatusFilter);
    }
}

function handleFrequencyChange() {
    const frequency = document.getElementById('frequency').value;
    const financialYearDiv = document.getElementById('financialYearDiv');
    const monthDiv = document.getElementById('monthDiv');
    const quarterDiv = document.getElementById('quarterDiv');

    financialYearDiv.style.display = 'none';
    monthDiv.style.display = 'none';
    quarterDiv.style.display = 'none';

    if (frequency === 'Monthly') {
        financialYearDiv.style.display = 'block';
        monthDiv.style.display = 'block';
    } else if (frequency === 'Quarterly') {
        financialYearDiv.style.display = 'block';
        quarterDiv.style.display = 'block';
    } else if (frequency === 'Annually') {
        financialYearDiv.style.display = 'block';
    }
}

function handleReturnDashboard(event) {
    event.preventDefault();
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());
	const monthMap = {
    "January": "Jan", "February": "Feb", "March": "Mar", "April": "Apr", "May": "May", "June": "Jun",
    "July": "Jul", "August": "Aug", "September": "Sep", "October": "Oct", "November": "Nov", "December": "Dec",
    "Jan": "Jan", "Feb": "Feb", "Mar": "Mar", "Apr": "Apr", "May": "May", "Jun": "Jun",
    "Jul": "Jul", "Aug": "Aug", "Sep": "Sep", "Oct": "Oct", "Nov": "Nov", "Dec": "Dec"
	};
	if (data.month) data.month = monthMap[data.month] || data.month;

    if (!data.frequency) {
        showAlert('Please select frequency', 'warning');
        return;
    }
    if (data.frequency !== 'Annually' && !data.financial_year) {
        showAlert('Please select financial year', 'warning');
        return;
    }
    if (data.frequency === 'Monthly' && !data.month) {
        showAlert('Please select month', 'warning');
        return;
    }
    if (data.frequency === 'Quarterly' && !data.quarter) {
        showAlert('Please select quarter', 'warning');
        return;
    }
    showLoading(true);
    fetch('/api/return_dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        if (data.success) {
            displayReturnDashboard(data.data, data.period);
        } else {
            showAlert('Error loading dashboard: ' + data.error, 'danger');
        }
    })
    .catch(error => {
        showLoading(false);
        showAlert('Error: ' + error.message, 'danger');
    });
}

function displayReturnDashboard(dashboardData, period) {
    const dashboardContainer = document.getElementById('dashboardContainer');
    if (!dashboardContainer) return;

    dashboardContainer.innerHTML = `
        <div class="row mb-4">
            <div class="col-12">
                <h3 class="text-primary">Return Dashboard - ${period}</h3>
                <hr>
            </div>
        </div>
    `;

    const frequency = document.getElementById('frequency') ? document.getElementById('frequency').value : null;

    // Helper to make a row with an array of tab keys
    function renderDashboardRow(tabKeys) {
        const row = document.createElement('div');
        row.className = 'dashboard-row';
        tabKeys.forEach(key => {
            if (dashboardData[key]) {
                row.appendChild(createDashboardCard(key, dashboardData[key], period));
            }
        });
        return row;
    }

    // == Custom Layouts ==
    if (frequency === "Monthly") {
        dashboardContainer.appendChild(renderDashboardRow(['GSTR-1', 'IFF']));
        dashboardContainer.appendChild(renderDashboardRow(['GSTR-3B', 'PMT-06']));
    } else if (frequency === "Quarterly") {
        dashboardContainer.appendChild(renderDashboardRow(['GSTR-3B (Q)', 'CMP-08']));
    } else {
        // Fallback: put all in one neat row
        dashboardContainer.appendChild(renderDashboardRow(Object.keys(dashboardData)));
    }

    dashboardContainer.style.display = 'block';
}

// Ensure createDashboardCard returns a .dashboard-card root (see below)




function createDashboardCard(returnType, data, period) {
    const card = document.createElement('div');
    card.className = 'dashboard-card';

    // Extract due date based on returnType & frequency
    const dueDate = GST_RETURNS?.[returnType]?.due_date || "";
	//const mergedDueDateText = dueDate && period ? `Due date: ${dueDate}-${period}`
	// :"";
	
	// const monthMap = {
	  // Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
	  // Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
	// };

	// function convertPeriodToNumericFormat(period) {
	  // const [monthAbbr, year] = period.split("-");
	  // const monthNum = monthMap[monthAbbr];
	  // return monthNum && year ? `${monthNum}-${year}` : period;
	// }

	// // Now generate the merged due date text:
	// const mergedDueDateText = (dueDate && period)
	  // ? `Due date: ${dueDate}-${convertPeriodToNumericFormat(period)}`
	  // : "";
	  
	const monthMap = {
	  Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
	  Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
	};

	function formatPeriodForDueText(period) {
	  if (!period) return "";

	  // ✅ Case 1: Month-Year format like "Jul-2025"
	  if (/^[A-Z][a-z]{2}-\d{4}$/.test(period)) {
		const [monthAbbr, year] = period.split("-");
		const currentMonth = parseInt(monthMap[monthAbbr]);
		let nextMonth = currentMonth + 1;
		let dueYear = parseInt(year);

		if (nextMonth > 12) {
		  nextMonth = 1;
		  dueYear += 1;
		}

		const dueDay = '11'; // Set your standard due day here
		const formattedMonth = String(nextMonth).padStart(2, '0');
		return `${formattedMonth}-${dueYear}`;
	  }

	  // ✅ Case 2: Financial Year like "2024-25"
	  if (/^\d{4}-\d{2}$/.test(period)) {
		const startYear = parseInt(period.substring(0, 4));
		if (!isNaN(startYear)) {
		  return `${startYear + 1}`;
		}
	  }

	  return period;
	}



	const mergedDueDateText =
		dueDate && period
		? `Due date: ${dueDate}-${formatPeriodForDueText(period)}`
		: "";

    card.innerHTML = `
        <div class="card-heading-area">
            <div class="card-title text-center">${returnType}</div>
            <div class="card-due-date text-center">${mergedDueDateText}</div>
        </div>

        <div class="return-stats">
            <div class="stat-item stat-total">
                <div class="stat-value">${data.total_clients}</div>
                <div class="stat-label">Total</div>
            </div>
            <div class="stat-item stat-filed">
                <div class="stat-value">${data.filed_returns}</div>
                <div class="stat-label">Filed</div>
            </div>
            <div class="stat-item stat-pending">
                <div class="stat-value">${data.pending_returns}</div>
                <div class="stat-label">Pending</div>
            </div>
        </div>

        <div class="progress-wrapper mt-2" style="width:100%;">
            <div class="progress-label d-flex justify-content-between">
                <span>Completion</span>
                <span><b>${data.total_clients > 0 ? Math.round((data.filed_returns / data.total_clients) * 100) : 0}%</b></span>
            </div>
            <div class="progress" style="height: 6px;">
                <div class="progress-bar bg-success" style="width:${data.total_clients > 0 ? (data.filed_returns / data.total_clients) * 100 : 0}%"></div>
            </div>
        </div>

        <div class="view-button text-center">
            <button class="btn btn-outline-primary btn-sm"
                onclick="showReturnDetails('${returnType}', '${period}')">
                <i class="fas fa-eye"></i> View Details
            </button>
        </div>
    `;
    return card;
}


function showReturnDetails(returnType, period) {
    currentReturnType = returnType;
    currentPeriod = period;
    showLoading(true);

    fetch('/api/return_clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ return_type: returnType, period: period })
    })
    .then(response => response.json())
    .then(data => {
        showLoading(false);
        if (data.success) {
            returnClientsData = data.data;

            // ✅ Pre-select all statuses except 'Filed'
		  const defaultStatuses = [
			"Data Received", "Saved", "Payment Issued", "Submitted"
		  ];
		  $('#statusFilter').val(defaultStatuses).trigger('change');

		  filterGridByStatus();
        } else {
            showAlert('Error loading return details: ' + data.error, 'danger');
        }
    })
    .catch(error => {
        showLoading(false);
        showAlert('Error: ' + error.message, 'danger');
    });
}

function displayReturnDetails(returnType, period, clients) {
    let modal = document.getElementById('returnDetailsModal');
    if (!modal) {
        createReturnDetailsModal();
        modal = document.getElementById('returnDetailsModal');
    }
    document.getElementById('returnDetailsModalLabel').textContent = `${returnType} - ${period}`;
    const tableBody = document.getElementById('returnDetailsTableBody');
    tableBody.innerHTML = '';

    clients.forEach(client => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${client.client_name}</td>
            <td>${client.gstin}</td>
            <td>${client.period}</td>
            <td>
                <input type="date" class="form-control form-control-sm"
                    value="${client.date_of_filing || ''}"
                    onchange="updateReturnField(${client.client_code}, 'date_of_filing', this.value)">
            </td>
            <td>
                <select class="form-select form-select-sm" name="status"
                    onchange="statusDropdownChanged(this, ${client.client_code})">
                    <option value="Data Received" ${client.status === 'Data Received' ? 'selected' : ''}>Data Received</option>
                    <option value="Saved" ${client.status === 'Saved' ? 'selected' : ''}>Saved</option>
                    <option value="Payment Issued" ${client.status === 'Payment Issued' ? 'selected' : ''}>Payment Issued</option>
                    <option value="Submitted" ${client.status === 'Submitted' ? 'selected' : ''}>Submitted</option>
                    <option value="Filed" ${client.status === 'Filed' ? 'selected' : ''}>Filed</option>
                </select>
            </td>
            <td>
                <input type="text" class="form-control form-control-sm" name="arn"
                    value="${client.arn || ''}"
                    ${client.status !== 'Filed' ? 'disabled' : ''}
                    onchange="updateReturnField(${client.client_code}, 'arn', this.value)">
            </td>
            <td>
                <input type="text" class="form-control form-control-sm"
                    value="${client.remarks || ''}"
                    onchange="updateReturnField(${client.client_code}, 'remarks', this.value)">
            </td>
            <td>
                <button class="btn btn-sm btn-success" onclick="saveReturnData(${client.client_code})">
                    <i class="fas fa-save"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // After rendering rows, ensure ARN fields are set properly as per status
    document.querySelectorAll('#returnDetailsTableBody tr').forEach(row => {
        setArnFieldState(row);
    });

    new bootstrap.Modal(document.getElementById('returnDetailsModal')).show();
}

// Status Filter Function
const statusFilterId = 'statusFilter';
const clearButtonId = 'clearStatusFilter';

// 1️⃣ Filter logic
function filterGridByStatus() {
  const selectedStatuses = $('#statusFilter').val();  // returns array or null

  let filtered = (!selectedStatuses || selectedStatuses.length === 0)
    ? returnClientsData
    : returnClientsData.filter(client => selectedStatuses.includes(client.status));

  displayReturnDetails(currentReturnType, currentPeriod, filtered);
}

// 2️⃣ Clear Filters
function clearStatusFilter() {
    const statusSelect = document.getElementById(statusFilterId);
    for (let option of statusSelect.options) {
        option.selected = false;
    }
    filterGridByStatus();
}

// 3️⃣ Pre-select defaults (everything except 'Filed')
function preSelectNonFiledStatuses() {
    const statusSelect = document.getElementById(statusFilterId);
    for (let option of statusSelect.options) {
        option.selected = option.value !== 'Filed';
    }
}

function createReturnDetailsModal() {
    const modalHTML = `
        <div class="modal fade" id="returnDetailsModal" tabindex="-1" aria-labelledby="returnDetailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-xl">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="returnDetailsModalLabel">Return Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <input type="text" id="searchInput" class="form-control" placeholder="Search clients...">
                            </div>
                            <div class="col-md-3">
                                <select id="statusFilter" class="form-select">
                                    <option value="">All Status</option>
                                    <option value="Data Received">Data Received</option>
                                    <option value="Saved">Saved</option>
                                    <option value="Payment Issued">Payment Issued</option>
                                    <option value="Submitted">Submitted</option>
                                    <option value="Filed">Filed</option>
                                </select>
                            </div>
                            <div class="col-md-3">
                                <button class="btn btn-success" onclick="saveAllReturnData()">
                                    <i class="fas fa-save"></i> Save All
                                </button>
                            </div>
                        </div>
                        <div class="table-responsive">
                            <table class="table table-striped table-hover">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Client Name</th>
                                        <th>GSTIN</th>
                                        <th>Period</th>
                                        <th>Date of Filing</th>
                                        <th>Status</th>
                                        <th>ARN</th>
                                        <th>Remarks</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody id="returnDetailsTableBody">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// This helper will set the ARN input enabled/disabled state as per the status field in each table row
function setArnFieldState(row) {
    const statusSelect = row.querySelector('select[name="status"]');
    const arnInput = row.querySelector('input[name="arn"]');
    if (statusSelect && arnInput) {
        if (statusSelect.value === 'Filed') {
            arnInput.removeAttribute('disabled');
        } else {
            arnInput.value = '';
            arnInput.setAttribute('disabled', true);
        }
    }
}

// New: called on status change
function statusDropdownChanged(selectEl, clientCode) {
    updateReturnField(clientCode, 'status', selectEl.value);
    // Set ARN field
    const row = selectEl.closest('tr');
    setArnFieldState(row);
}

function updateReturnField(clientCode, field, value) {
    const clientIndex = returnClientsData.findIndex(c => c.client_code === clientCode);
    if (clientIndex !== -1) {
        returnClientsData[clientIndex][field] = value;

        // Only manage ARN logic when field updated is 'status'
        if (field === 'status') {
            const row = event.target.closest('tr');
            const arnInput = row.querySelector('input[name="arn"]');
            
            if (value === 'Filed') {
                // Enable ARN input
                if (arnInput) arnInput.removeAttribute('disabled');
            } else {
                // Clear ARN value from UI and memory
                if (arnInput) {
                    arnInput.value = '';
                    arnInput.setAttribute('disabled', true);
                }
                // 💡 This is key:
                returnClientsData[clientIndex]['arn'] = '';
            }
        }
    }
}


function saveReturnData(clientCode) {
    const client = returnClientsData.find(c => c.client_code === clientCode);
    if (!client) return;

    const returnData = {
        client_code: clientCode,
        return_type: currentReturnType,
        period: currentPeriod,
        date_of_filing: client.date_of_filing || null,
        status: client.status,
        arn: client.arn || null,
        remarks: client.remarks || null
    };

    fetch('/api/save_return_data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert('Return data saved successfully!', 'success');
        } else {
            showAlert('Error saving return data: ' + data.error, 'danger');
        }
    })
    .catch(error => {
        showAlert('Error: ' + error.message, 'danger');
    });
}

function saveAllReturnData() {
    const promises = returnClientsData.map(client => {
        const returnData = {
            client_code: client.client_code,
            return_type: currentReturnType,
            period: currentPeriod,
            date_of_filing: client.date_of_filing || null,
            status: client.status,
            arn: client.arn || null,
            remarks: client.remarks || null
        };
        return fetch('/api/save_return_data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(returnData)
        }).then(response => response.json());
    });

    Promise.all(promises)
        .then(results => {
            const successCount = results.filter(r => r.success).length;
            const errorCount = results.length - successCount;
            if (errorCount === 0) {
                showAlert(`All ${successCount} return data saved successfully!`, 'success');
            } else {
                showAlert(`${successCount} saved successfully, ${errorCount} failed.`, 'warning');
            }
        })
        .catch(error => {
            showAlert('Error saving return data: ' + error.message, 'danger');
        });
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const tableBody = document.getElementById('returnDetailsTableBody');
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const clientName = row.cells[0].textContent.toLowerCase();
        const gstin = row.cells[1].textContent.toLowerCase();
        if (clientName.includes(searchTerm) || gstin.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function handleStatusFilter() {
    const statusFilter = document.getElementById('statusFilter').value;
    const tableBody = document.getElementById('returnDetailsTableBody');
    const rows = tableBody.querySelectorAll('tr');
    rows.forEach(row => {
        const statusSelect = row.cells[4].querySelector('select');
        const currentStatus = statusSelect.value;
        if (statusFilter === '' || currentStatus === statusFilter) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'block' : 'none';
    }
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.setAttribute('role', 'alert');
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    const mainContainer = document.querySelector('.container-fluid');
    if (mainContainer) {
        mainContainer.insertBefore(alertDiv, mainContainer.firstChild);
    } else {
        document.body.insertBefore(alertDiv, document.body.firstChild);
    }
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Utility validators
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
}
function validateGSTIN(gstin) {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return gstinRegex.test(gstin);
}
function validateMobile(mobile) {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile);
}
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Window exports
window.showReturnDetails = showReturnDetails;
window.updateReturnField = updateReturnField;
window.saveReturnData = saveReturnData;
window.saveAllReturnData = saveAllReturnData;
window.handleSearch = handleSearch;
window.handleStatusFilter = handleStatusFilter;
window.showAlert = showAlert;
window.statusDropdownChanged = statusDropdownChanged;
