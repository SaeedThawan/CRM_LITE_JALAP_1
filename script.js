// ✅ رابط تطبيق Google Apps Script المنشور
const GOOGLE_SHEETS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwfmg3N7aKgNKbxmnFR8z-Avze3Cl_ecMtJcgCgMVsZ9FveW6we_0JhtwUNUBnHVFAsnA/exec';

// 🔽 تعريف المتغيرات العامة للبيانات
let productsData = [];
let inventoryProductsData = [];
let salesRepresentatives = [];
let customersMain = [];
let visitOutcomes = [];
let visitPurposes = [];
let visitTypes = [];

// 🔽 عناصر DOM المستخدمة
const visitForm = document.getElementById('visitForm');
const salesRepNameSelect = document.getElementById('salesRepName');
const customerNameInput = document.getElementById('customerName');
const customerListDatalist = document.getElementById('customerList');
const visitTypeSelect = document.getElementById('visitType');
const visitPurposeSelect = document.getElementById('visitPurpose');
const visitOutcomeSelect = document.getElementById('visitOutcome');
const customerTypeSelect = document.getElementById('customerType');

const productCategoriesDiv = document.getElementById('productCategories');
const productsDisplayDiv = document.getElementById('productsDisplay');

const inventorySectionDiv = document.getElementById('inventorySection');
const inventoryListDatalist = document.getElementById('inventoryList');
const inventoryItemsContainer = document.getElementById('inventoryItemsContainer');
const addInventoryItemBtn = document.getElementById('addInventoryItem');

const normalVisitRelatedFieldsDiv = document.getElementById('normalVisitRelatedFields');
const normalProductSectionDiv = document.getElementById('normalProductSection');

const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

// ✅ رسائل التنبيه باستخدام SweetAlert2
function showSuccessMessage() {
  Swal.fire({ title: '✅ تم الإرسال!', text: 'تم إرسال النموذج بنجاح.', icon: 'success', confirmButtonText: 'ممتاز' });
}
function showErrorMessage(message) {
  Swal.fire({ title: '❌ فشل الإرسال', text: message || 'حدث خطأ أثناء إرسال النموذج.', icon: 'error', confirmButtonText: 'موافق' });
}
function showWarningMessage(message) {
  Swal.fire({ title: '⚠️ تنبيه', text: message, icon: 'warning', confirmButtonText: 'موافق' });
}

// ✅ توليد معرفات وتواريخ
function generateVisitID() {
  return `VISIT-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
function generateInventoryID() {
  return `INV-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}
function formatDate(date) {
  return date.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatTime(date) {
  return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}
function formatTimestamp(date) {
  return date.toLocaleString('ar-SA', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

// ✅ تحميل البيانات من ملفات JSON
async function fetchJsonData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`خطأ في تحميل ${url}`);
    return await response.json();
  } catch (error) {
    console.error(`❌ ${url}:`, error);
    showErrorMessage(`فشل تحميل البيانات من ${url}`);
    return [];
  }
}

async function loadAllData() {
  [
    productsData,
    inventoryProductsData,
    salesRepresentatives,
    customersMain,
    visitOutcomes,
    visitPurposes,
    visitTypes
  ] = await Promise.all([
    fetchJsonData('products.json'),
    fetchJsonData('inventory_products.json'),
    fetchJsonData('sales_representatives.json'),
    fetchJsonData('customers_main.json'),
    fetchJsonData('visit_outcomes.json'),
    fetchJsonData('visit_purposes.json'),
    fetchJsonData('visit_types.json')
  ]);

  populateSelect(salesRepNameSelect, salesRepresentatives, 'Sales_Rep_Name_AR', 'Sales_Rep_Name_AR');
  populateCustomerDatalist();
  populateSelect(visitTypeSelect, visitTypes, 'Visit_Type_Name_AR', 'Visit_Type_Name_AR');
  populateSelect(visitPurposeSelect, visitPurposes);
  populateSelect(visitOutcomeSelect, visitOutcomes);
  setupProductCategories();
  populateInventoryDatalist();
}

// ✅ تعبئة القوائم المنسدلة والداتاليستات
function populateSelect(select, list, valueKey, textKey) {
  while (select.children.length > 1) select.removeChild(select.lastChild);
  list.forEach(item => {
    const option = document.createElement('option');
    option.value = item[valueKey] || item;
    option.textContent = item[textKey] || item;
    select.appendChild(option);
  });
}

function populateCustomerDatalist() {
  customerListDatalist.innerHTML = '';
  customersMain.forEach(c => {
    const option = document.createElement('option');
    option.value = c.Customer_Name_AR;
    customerListDatalist.appendChild(option);
  });
}

function populateInventoryDatalist() {
  inventoryListDatalist.innerHTML = '';
  inventoryProductsData.forEach(product => {
    const option = document.createElement('option');
    option.value = product.Product_Name_AR;
    for (const key in product) {
      const camelKey = key.replace(/_(\w)/g, (_, c) => c.toUpperCase());
      option.dataset[camelKey] = product[key];
    }
    inventoryListDatalist.appendChild(option);
  });
}

// ✅ إدارة المنتجات للزيارات العادية
let productCategories = {};
function setupProductCategories() {
  productCategoriesDiv.innerHTML = '';
  productCategories = {};
  productsData.forEach(p => {
    if (!productCategories[p.Category]) productCategories[p.Category] = [];
    productCategories[p.Category].push(p);
  });
  for (const category in productCategories) {
    const div = document.createElement('div');
    div.className = 'flex items-center';
    div.innerHTML = `
      <input type="checkbox" id="cat-${category}" value="${category}" class="h-5 w-5 cursor-pointer">
      <label for="cat-${category}" class="ml-2">${category}</label>
    `;
    productCategoriesDiv.appendChild(div);
    div.querySelector('input').addEventListener('change', e => toggleProductsDisplay(category, e.target.checked));
  }
}

function toggleProductsDisplay(category, show) {
  const products = productCategories[category];
  if (!products) return;

  if (show) {
    products.forEach(product => {
      const uniqueId = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const div = document.createElement('div');
      div.className = 'product-item border p-3 rounded flex justify-between';
      div.setAttribute('data-category', category);
      div.innerHTML = `
        <label>${product.Product_Name_AR}</label>
        <div class="radio-group flex space-x-4 space-x-reverse">
          <label><input type="radio" name="status-${uniqueId}" value="متوفر" required> <span>متوفر</span></label>
          <label><input type="radio" name="status-${uniqueId}" value="غير متوفر" required> <span>غير متوفر</span></label>
        </div>
      `;
      productsDisplayDiv.appendChild(div);
    });
  } else {
    productsDisplayDiv.querySelectorAll(`[data-category="${category}"]`).forEach(el => el.remove());
  }
}
// ✅ عناصر الجرد
function addInventoryItem() {
  const template = `
    <div class="inventory-item border p-4 rounded relative bg-white">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label>المنتج</label><input type="text" name="Inventory_Product_Name_AR" list="inventoryList" required></div>
        <div><label>الكمية</label><input type="number" name="Inventory_Quantity" min="0" required></div>
        <div><label>تاريخ الانتهاء</label><input type="date" name="Expiration_Date" required></div>
        <div><label>الوحدة</label>
          <select name="Unit_Label" required>
            <option value="">اختر الوحدة</option>
            <option value="علبة">علبة</option>
            <option value="شد">شد</option>
            <option value="باكت">باكت</option>
          </select>
        </div>
      </div>
      <button type="button" class="removeInventoryItem absolute top-2 left-2 text-red-600 text-sm">❌ حذف</button>
    </div>
  `;
  const item = document.createRange().createContextualFragment(template);
  inventoryItemsContainer.appendChild(item);
}

function addInitialInventoryItem() {
  inventoryItemsContainer.innerHTML = '';
  addInventoryItem();
}

// ✅ التحقق من البيانات وإرسالها
async function handleSubmit(event) {
  event.preventDefault();
  submitBtn.disabled = true;
  loadingSpinner.classList.remove('hidden');

  const formData = new FormData(visitForm);
  const now = new Date();
  const selectedVisitType = visitTypeSelect.value;
  let payload = {};

  if (!salesRepNameSelect.value || !customerNameInput.value || !visitTypeSelect.value) {
    showWarningMessage('يرجى تعبئة حقول المندوب والعميل ونوع الزيارة.');
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
    return;
  }

  if (selectedVisitType !== 'جرد استثنائي' &&
     (!visitPurposeSelect.value || !visitOutcomeSelect.value || !customerTypeSelect.value)) {
    showWarningMessage('يرجى تعبئة حقول الغرض والنتيجة ونوع العميل.');
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
    return;
  }
  
  if (selectedVisitType === 'جرد استثنائي') {
    const collectedInventoryData = [];

    inventoryItemsContainer.querySelectorAll('.inventory-item').forEach(div => {
      const productName = div.querySelector('[name="Inventory_Product_Name_AR"]')?.value || '';
      const quantity = div.querySelector('[name="Inventory_Quantity"]')?.value || '';
      const unitLabel = div.querySelector('[name="Unit_Label"]')?.value || '';
      const expirationDate = div.querySelector('[name="Expiration_Date"]')?.value || '';

      if (!productName && !quantity && !unitLabel && !expirationDate) return;

      const selectedOption = inventoryListDatalist.querySelector(`option[value="${productName}"]`);
      const productDetails = {};
      if (selectedOption) {
        for (const key in selectedOption.dataset) {
          productDetails[key] = selectedOption.dataset[key];
        }
      }

      collectedInventoryData.push({
        Inventory_ID: generateInventoryID(),
        Timestamp: formatTimestamp(now),
        Entry_User_Name: formData.get('Entry_User_Name'),
        Sales_Rep_Name_AR: formData.get('Sales_Rep_Name_AR'),
        Customer_Name_AR: formData.get('Customer_Name_AR'),
        Customer_Code: customersMain.find(c => c.Customer_Name_AR === formData.get('Customer_Name_AR'))?.Customer_Code || '',
        Product_Name_AR: productName,
        Product_Code: productDetails.productCode || '',
        Category: productDetails.category || '',
        Package_Type: productDetails.packageType || '',
        Unit_Size: productDetails.unitSize || '',
        Quantity: quantity,
        Expiration_Date: expirationDate,
        Unit_Label: unitLabel,
        Notes: formData.get('Notes') || ''
      });
    });

    if (collectedInventoryData.length === 0) {
      showWarningMessage('يجب إدخال بيانات منتج واحد على الأقل.');
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    payload = {
      sheetName: 'Inventory_Logs',
      data: collectedInventoryData
    };
  } else {
    if (!visitForm.checkValidity()) {
      showWarningMessage('يرجى تعبئة جميع الحقول المطلوبة.');
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    if (!validateProductStatuses()) {
      submitBtn.disabled = false;
      loadingSpinner.classList.add('hidden');
      return;
    }

    const dataToSubmit = {
      Visit_ID: generateVisitID(),
      Customer_Name_AR: formData.get('Customer_Name_AR'),
      Customer_Code: customersMain.find(c => c.Customer_Name_AR === formData.get('Customer_Name_AR'))?.Customer_Code || '',
      Sales_Rep_Name_AR: formData.get('Sales_Rep_Name_AR'),
      Visit_Date: formatDate(now),
      Visit_Time: formatTime(now),
      Visit_Purpose: formData.get('Visit_Purpose'),
      Visit_Outcome: formData.get('Visit_Outcome'),
      Visit_Type_Name_AR: formData.get('Visit_Type_Name_AR'),
      Entry_User_Name: formData.get('Entry_User_Name'),
      Timestamp: formatTimestamp(now),
      Customer_Type: formData.get('Customer_Type'),
      Notes: formData.get('Notes') || ''
    };

    const available = [], unavailable = [];
    productsDisplayDiv.querySelectorAll('.product-item').forEach(div => {
      const name = div.querySelector('label').textContent;
      const selected = div.querySelector('input[type="radio"]:checked');
      if (selected) {
        (selected.value === 'متوفر' ? available : unavailable).push(name);
      }
    });

    dataToSubmit.Available_Products_Names = available.join(', ');
    dataToSubmit.Unavailable_Products_Names = unavailable.join(', ');

    payload = {
      sheetName: 'Visit_Logs',
      data: [dataToSubmit]
    };
  }

  // ✅ إرسال البيانات
  console.log("📤 Sending payload:", payload);

  try {
    const response = await fetch(GOOGLE_SHEETS_WEB_APP_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    showSuccessMessage();
    visitForm.reset();
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
    productsDisplayDiv.innerHTML = '';
    document.querySelectorAll('#productCategories input[type="checkbox"]').forEach(c => c.checked = false);
    inventoryItemsContainer.innerHTML = '';
    addInitialInventoryItem();
    toggleVisitSections(visitTypeSelect.value);
  } catch (error) {
    console.error("❌ فشل الإرسال:", error);
    showErrorMessage('حدث خطأ أثناء إرسال البيانات.');
    submitBtn.disabled = false;
    loadingSpinner.classList.add('hidden');
  }
}

// ✅ تبديل الأقسام حسب نوع الزيارة
function toggleVisitSections(type) {
  if (type === 'جرد استثنائي') {
    normalVisitRelatedFieldsDiv.classList.add('hidden');
    normalProductSectionDiv.classList.add('hidden');
    inventorySectionDiv.classList.remove('hidden');
  } else {
    normalVisitRelatedFieldsDiv.classList.remove('hidden');
    normalProductSectionDiv.classList.remove('hidden');
    inventorySectionDiv.classList.add('hidden');
    inventoryItemsContainer.innerHTML = '';
    addInitialInventoryItem();
  }
}

// ✅ أحداث الصفحة
document.addEventListener('DOMContentLoaded', () => {
  loadAllData();
  addInitialInventoryItem();
  visitForm.addEventListener('submit', handleSubmit);
  visitTypeSelect.addEventListener('change', e => toggleVisitSections(e.target.value));
  addInventoryItemBtn.addEventListener('click', addInventoryItem);

  inventoryItemsContainer.addEventListener('click', e => {
    if (e.target.classList.contains('removeInventoryItem')) {
      if (inventoryItemsContainer.children.length > 1) {
        e.target.closest('.inventory-item').remove();
      } else {
        showWarningMessage('يجب أن يحتوي قسم الجرد على منتج واحد على الأقل.');
      }
    }
  });

  toggleVisitSections(visitTypeSelect.value);
});