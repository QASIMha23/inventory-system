// ======================================================
// SUPABASE CONFIGURATION
// ======================================================

const SUPABASE_URL = "https://fgmkgskvcxmefsaidkgi.supabase.co/";

const SUPABASE_KEY = "sb_publishable_aBhNqSEabLliyJK1xs0qaw_YobeNYuK";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// ======================================================
// GLOBAL STATE
// ======================================================

let inventoryData = [];


// ======================================================
// HELPERS
// ======================================================

function $(id) {
    return document.getElementById(id);
}


function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function statusLabel(status) {

    switch (status) {

        case "normal":
            return `<span class="status status-normal">🟢 طبيعي</span>`;

        case "low":
            return `<span class="status status-low">🟠 منخفض</span>`;

        case "purchase":
            return `<span class="status status-purchase">🔴 يجب الشراء</span>`;

        case "out_of_stock":
            return `<span class="status status-out">🔴 نفد</span>`;

        default:
            return "";
    }
}


function today() {

    return new Date()
        .toISOString()
        .slice(0, 10);
}


// ======================================================
// AUTH
// ======================================================

async function checkUser() {

    const {
        data,
        error
    } = await supabaseClient
        .auth
        .getSession();

    if (error) {

        console.error(error);

        return;
    }

    if (data.session) {

        showApp(data.session.user);

    } else {

        showLogin();
    }
}


function showLogin() {

    $("loginScreen")
        .classList
        .remove("hidden");

    $("app")
        .classList
        .add("hidden");
}


function showApp(user) {

    $("loginScreen")
        .classList
        .add("hidden");

    $("app")
        .classList
        .remove("hidden");

    $("currentUser")
        .textContent = user.email;

    loadDashboard();
}


// ======================================================
// LOGIN
// ======================================================

async function login() {

    const email =
        $("email").value.trim();

    const password =
        $("password").value;

    $("loginMessage")
        .textContent = "جاري الدخول...";

    const {
        data,
        error
    } = await supabaseClient
        .auth
        .signInWithPassword({
            email,
            password
        });

    if (error) {

        $("loginMessage")
            .textContent =
            "خطأ: " + error.message;

        return;
    }

    showApp(data.user);
}


// ======================================================
// LOGOUT
// ======================================================

async function logout() {

    await supabaseClient
        .auth
        .signOut();

    showLogin();
}


// ======================================================
// LOAD INVENTORY
// ======================================================

async function loadInventory() {

    const {
        data,
        error
    } = await supabaseClient
        .from("inventory_status")
        .select("*")
        .order("product_name");

    if (error) {

        console.error(error);

        alert(
            "حدث خطأ أثناء تحميل المخزون"
        );

        return [];
    }

    inventoryData = data || [];

    return inventoryData;
}


// ======================================================
// DASHBOARD
// ======================================================

async function loadDashboard() {

    const data =
        await loadInventory();

    const total =
        data.length;

    const low =
        data.filter(
            x => x.stock_status === "low"
        ).length;

    const purchase =
        data.filter(
            x =>
                x.stock_status === "purchase"
                ||
                x.stock_status === "out_of_stock"
        ).length;

    const out =
        data.filter(
            x =>
                x.stock_status ===
                "out_of_stock"
        ).length;


    $("totalProducts")
        .textContent = total;

    $("lowProducts")
        .textContent = low;

    $("purchaseProducts")
        .textContent = purchase;

    $("outProducts")
        .textContent = out;


    renderPurchaseTable(
        data.filter(
            x =>
                x.stock_status ===
                "purchase"
                ||
                x.stock_status ===
                "out_of_stock"
        )
    );


    renderLowTable(
        data.filter(
            x =>
                x.stock_status ===
                "low"
        )
    );
}


// ======================================================
// PURCHASE TABLE
// ======================================================

function renderPurchaseTable(data) {

    if (!data.length) {

        $("purchaseTable")
            .innerHTML =
            "<p>لا توجد أصناف تحتاج شراء حاليًا.</p>";

        return;
    }

    let html = `

        <table>

            <thead>

                <tr>

                    <th>الصنف</th>
                    <th>الرصيد</th>
                    <th>الحد الأدنى</th>
                    <th>الوحدة</th>
                    <th>الحالة</th>

                </tr>

            </thead>

            <tbody>
    `;


    data.forEach(item => {

        html += `

            <tr>

                <td>
                    ${escapeHtml(
                        item.product_name
                    )}
                </td>

                <td>
                    ${item.current_stock}
                </td>

                <td>
                    ${item.minimum_stock}
                </td>

                <td>
                    ${escapeHtml(
                        item.unit_name
                    )}
                </td>

                <td>
                    ${statusLabel(
                        item.stock_status
                    )}
                </td>

            </tr>

        `;

    });


    html += `
            </tbody>
        </table>
    `;

    $("purchaseTable")
        .innerHTML = html;
}


// ======================================================
// LOW STOCK TABLE
// ======================================================

function renderLowTable(data) {

    if (!data.length) {

        $("lowTable")
            .innerHTML =
            "<p>لا توجد أصناف منخفضة المخزون.</p>";

        return;
    }

    let html = `

        <table>

            <thead>

                <tr>

                    <th>الصنف</th>
                    <th>الرصيد</th>
                    <th>حد التنبيه</th>
                    <th>الوحدة</th>

                </tr>

            </thead>

            <tbody>
    `;


    data.forEach(item => {

        html += `

            <tr>

                <td>
                    ${escapeHtml(
                        item.product_name
                    )}
                </td>

                <td>
                    ${item.current_stock}
                </td>

                <td>
                    ${item.warning_stock}
                </td>

                <td>
                    ${escapeHtml(
                        item.unit_name
                    )}
                </td>

            </tr>

        `;

    });


    html += `
            </tbody>
        </table>
    `;

    $("lowTable")
        .innerHTML = html;
}


// ======================================================
// PRODUCTS
// ======================================================

async function loadProducts() {

    const data =
        await loadInventory();

    renderProducts(
        data
    );
}


function renderProducts(data) {

    let html = `

        <table>

            <thead>

                <tr>

                    <th>الكود</th>
                    <th>الصنف</th>
                    <th>الوحدة</th>
                    <th>الرصيد</th>
                    <th>الحد الأدنى</th>
                    <th>الحالة</th>

                </tr>

            </thead>

            <tbody>
    `;


    data.forEach(item => {

        html += `

            <tr>

                <td>
                    ${escapeHtml(
                        item.product_code
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item.product_name
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        item.unit_name
                    )}
                </td>

                <td>
                    ${item.current_stock}
                </td>

                <td>
                    ${item.minimum_stock}
                </td>

                <td>
                    ${statusLabel(
                        item.stock_status
                    )}
                </td>

            </tr>

        `;

    });


    html += `
            </tbody>
        </table>
    `;

    $("productsTable")
        .innerHTML = html;
}


// ======================================================
// LOAD PRODUCT SELECTS
// ======================================================

async function loadProductSelects() {

    const {
        data,
        error
    } = await supabaseClient
        .from("products")
        .select(
            "id, product_code, product_name"
        )
        .eq("active", true)
        .order("product_name");


    if (error) {

        console.error(error);

        return;
    }


    const options = data
        .map(
            p =>
                `<option value="${p.id}">
                    ${escapeHtml(
                        p.product_name
                    )}
                </option>`
        )
        .join("");


    $("transactionProduct")
        .innerHTML =
        `<option value="">
            اختر الصنف
        </option>` + options;


    $("adjustProduct")
        .innerHTML =
        `<option value="">
            اختر الصنف
        </option>` + options;
}


// ======================================================
// SAVE TRANSACTION
// ======================================================

async function saveTransaction() {

    const productId =
        $("transactionProduct").value;

    const type =
        $("transactionType").value;

    const quantity =
        Number(
            $("transactionQuantity").value
        );

    const notes =
        $("transactionNotes")
            .value
            .trim();


    if (!productId) {

        alert("اختر الصنف");

        return;
    }


    if (!quantity || quantity <= 0) {

        alert("أدخل كمية صحيحة");

        return;
    }


    if (type === "out") {

        const item =
            inventoryData.find(
                x =>
                    x.id === productId
            );

        if (
            item &&
            quantity >
            Number(
                item.current_stock
            )
        ) {

            alert(
                "الكمية المطلوبة أكبر من الرصيد الحالي."
            );

            return;
        }
    }


    const {
        data: {
            user
        }
    } =
        await supabaseClient
            .auth
            .getUser();


    const {
        error
    } = await supabaseClient
        .from("transactions")
        .insert({

            product_id:
                productId,

            transaction_date:
                today(),

            transaction_type:
                type,

            quantity:
                quantity,

            notes:
                notes || null,

            created_by:
                user.id
        });


    if (error) {

        console.error(error);

        alert(
            "حدث خطأ: " +
            error.message
        );

        return;
    }


    alert("تم حفظ الحركة بنجاح");


    $("transactionQuantity")
        .value = "";

    $("transactionNotes")
        .value = "";


    await loadDashboard();

    await loadTodayTransactions();
}


// ======================================================
// TODAY TRANSACTIONS
// ======================================================

async function loadTodayTransactions() {

    const {
        data,
        error
    } = await supabaseClient
        .from("transactions")
        .select(`
            id,
            transaction_date,
            transaction_type,
            quantity,
            notes,
            product_id,
            products (
                product_name
            )
        `)
        .eq(
            "transaction_date",
            today()
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(error);

        return;
    }


    if (!data.length) {

        $("todayTransactions")
            .innerHTML =
            "<p>لا توجد حركات اليوم.</p>";

        return;
    }


    let html = `

        <table>

            <thead>

                <tr>

                    <th>الصنف</th>
                    <th>الحركة</th>
                    <th>الكمية</th>
                    <th>الملاحظات</th>

                </tr>

            </thead>

            <tbody>
    `;


    data.forEach(item => {

        html += `

            <tr>

                <td>
                    ${escapeHtml(
                        item.products
                            ?.product_name
                    )}
                </td>

                <td>
                    ${
                        item.transaction_type
                        === "in"
                        ? "📥 وارد"
                        : "📤 صادر"
                    }
                </td>

                <td>
                    ${item.quantity}
                </td>

                <td>
                    ${escapeHtml(
                        item.notes || ""
                    )}
                </td>

            </tr>

        `;

    });


    html += `
            </tbody>
        </table>
    `;


    $("todayTransactions")
        .innerHTML = html;
}


// ======================================================
// SAVE ADJUSTMENT
// ======================================================

async function saveAdjustment() {

    const productId =
        $("adjustProduct").value;

    const actual =
        Number(
            $("actualQuantity").value
        );

    const reason =
        $("adjustReason")
            .value
            .trim();


    if (!productId) {

        alert("اختر الصنف");

        return;
    }


    if (
        Number.isNaN(actual)
        ||
        actual < 0
    ) {

        alert(
            "أدخل كمية صحيحة"
        );

        return;
    }


    const item =
        inventoryData.find(
            x =>
                x.id === productId
        );


    if (!item) {

        alert(
            "تعذر العثور على الصنف"
        );

        return;
    }


    const {
        data: {
            user
        }
    } =
        await supabaseClient
            .auth
            .getUser();


    const {
        error
    } =
        await supabaseClient
            .from("stock_adjustments")
            .insert({

                product_id:
                    productId,

                adjustment_date:
                    today(),

                system_quantity:
                    Number(
                        item.current_stock
                    ),

                actual_quantity:
                    actual,

                reason:
                    reason || null,

                created_by:
                    user.id
            });


    if (error) {

        console.error(error);

        alert(
            "حدث خطأ: " +
            error.message
        );

        return;
    }


    alert(
        "تم تسجيل الجرد بنجاح"
    );


    $("actualQuantity")
        .value = "";

    $("adjustReason")
        .value = "";


    await loadDashboard();
}


// ======================================================
// PURCHASE PAGE
// ======================================================

async function loadPurchases() {

    const data =
        await loadInventory();


    const purchases =
        data.filter(
            x =>
                x.stock_status ===
                "purchase"
                ||
                x.stock_status ===
                "out_of_stock"
        );


    renderPurchaseTable(
        purchases
    );


    $("purchaseFullTable")
        .innerHTML =
        $("purchaseTable")
            .innerHTML;
}


// ======================================================
// NAVIGATION
// ======================================================

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(
            p =>
                p.classList
                    .add("hidden")
        );


    const pageElement =
        $(page + "Page");


    if (!pageElement) {
        return;
    }


    pageElement
        .classList
        .remove("hidden");


    const titles = {

        dashboard:
            "الرئيسية",

        products:
            "الأصناف",

        transactions:
            "حركة المخزون",

        purchases:
            "يجب الشراء",

        adjustments:
            "الجرد",

        reports:
            "التقارير",

        users:
            "المستخدمون"
    };


    $("pageTitle")
        .textContent =
        titles[page]
        || "نظام المخزون";


    if (page === "dashboard") {

        loadDashboard();

    }


    if (page === "products") {

        loadProducts();

    }


    if (page === "transactions") {

        $("todayDate")
            .textContent =
            today();

        loadProductSelects();

        loadTodayTransactions();

    }


    if (page === "purchases") {

        loadPurchases();

    }


    if (page === "adjustments") {

        loadProductSelects();

    }
}


// ======================================================
// EVENTS
// ======================================================

$("loginButton")
    .addEventListener(
        "click",
        login
    );


$("logoutButton")
    .addEventListener(
        "click",
        logout
    );


$("saveTransaction")
    .addEventListener(
        "click",
        saveTransaction
    );


$("saveAdjustment")
    .addEventListener(
        "click",
        saveAdjustment
    );


document
    .querySelectorAll(
        ".sidebar button[data-page]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.page
                    );

                }
            );

        }
    );


// ======================================================
// SEARCH
// ======================================================

$("productSearch")
    .addEventListener(
        "input",
        function () {

            const query =
                this.value
                    .trim()
                    .toLowerCase();


            const filtered =
                inventoryData.filter(
                    item =>
                        item.product_name
                            .toLowerCase()
                            .includes(query)
                        ||
                        item.product_code
                            .toLowerCase()
                            .includes(query)
                );


            renderProducts(
                filtered
            );

        }
    );


// ======================================================
// AUTH STATE
// ======================================================

supabaseClient
    .auth
    .onAuthStateChange(
        (_event, session) => {

            if (session) {

                showApp(
                    session.user
                );

            } else {

                showLogin();

            }

        }
    );


// ======================================================
// START
// ======================================================

checkUser();
