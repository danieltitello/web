const STORAGE_KEY = "miles-programs";

const programDialog = document.querySelector("#program-dialog");
const deleteDialog = document.querySelector("#delete-dialog");
const programForm = document.querySelector("#program-form");
const deleteForm = document.querySelector("#delete-form");
const programGrid = document.querySelector("#program-grid");
const programTemplate = document.querySelector("#program-template");
const emptyState = document.querySelector("#empty-state");
const searchInput = document.querySelector("#program-search");

let programs = loadPrograms();
let deletingId = null;

function loadPrograms() {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
		return Array.isArray(saved) ? saved : [];
	} catch {
		return [];
	}
}

function savePrograms() {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(programs));
}

function parseMiles(value) {
	const miles = Number(String(value).replace(/[^0-9]/g, ""));
	return Number.isFinite(miles) ? miles : 0;
}

function formatMiles(value) {
	return new Intl.NumberFormat("en-US").format(value);
}

function getInitial(name) {
	return name.trim().charAt(0).toUpperCase() || "M";
}

function formatUpdated(dateValue) {
	if (!dateValue) return "Updated recently";

	const date = new Date(dateValue);
	if (Number.isNaN(date.getTime())) return "Updated recently";

	return `Updated ${new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric"
	}).format(date)}`;
}

function openProgramDialog(program = null) {
	document.querySelector("#dialog-title").textContent = program ? "Edit program" : "Add program";
	document.querySelector("#save-program").textContent = program ? "Save changes" : "Save program";
	document.querySelector("#program-id").value = program?.id || "";
	document.querySelector("#program-name").value = program?.name || "";
	document.querySelector("#program-miles").value = program ? formatMiles(program.miles) : "";
	document.querySelector("#program-membership").value = program?.membership || "";
	programDialog.showModal();
	document.querySelector("#program-name").focus();
}

function closeProgramDialog() {
	programDialog.close();
	programForm.reset();
}

function renderPrograms() {
	const query = searchInput.value.trim().toLowerCase();
	const visiblePrograms = programs
		.filter((program) => {
			return program.name.toLowerCase().includes(query)
				|| (program.membership || "").toLowerCase().includes(query);
		})
		.sort((a, b) => b.miles - a.miles);

	programGrid.replaceChildren();

	visiblePrograms.forEach((program) => {
		const card = programTemplate.content.cloneNode(true);
		card.querySelector(".program-logo").textContent = getInitial(program.name);
		card.querySelector(".program-name").textContent = program.name;
		card.querySelector(".membership").textContent = program.membership
			? `Member no. ${program.membership}`
			: "Membership number not set";
		card.querySelector(".balance strong").textContent = formatMiles(program.miles);
		card.querySelector(".updated").textContent = formatUpdated(program.updatedAt);

		const editButton = card.querySelector(".edit-button");
		const deleteButton = card.querySelector(".delete-button");
		editButton.setAttribute("aria-label", `Edit ${program.name}`);
		deleteButton.setAttribute("aria-label", `Remove ${program.name}`);
		editButton.addEventListener("click", () => openProgramDialog(program));
		deleteButton.addEventListener("click", () => openDeleteDialog(program));

		programGrid.append(card);
	});

	const noPrograms = visiblePrograms.length === 0;
	emptyState.hidden = !noPrograms;
	programGrid.hidden = noPrograms;

	if (noPrograms && query) {
		emptyState.querySelector("h3").textContent = "No matches found";
		emptyState.querySelector("p").textContent = `Nothing matches “${searchInput.value.trim()}”.`;
		document.querySelector("#empty-add-button").hidden = true;
	} else if (noPrograms) {
		emptyState.querySelector("h3").textContent = "No programs yet";
		emptyState.querySelector("p").textContent = "Add your first loyalty program to start tracking your miles.";
		document.querySelector("#empty-add-button").hidden = false;
	}

	const total = programs.reduce((sum, program) => sum + program.miles, 0);
	document.querySelector("#total-miles").textContent = formatMiles(total);
	document.querySelector("#program-count").textContent =
		`${programs.length} ${programs.length === 1 ? "program" : "programs"}`;
}

function openDeleteDialog(program) {
	deletingId = program.id;
	document.querySelector("#delete-message").textContent =
		`Remove ${program.name} and its ${formatMiles(program.miles)} miles?`;
	deleteDialog.showModal();
}

document.querySelector("#open-program-dialog").addEventListener("click", () => openProgramDialog());
document.querySelector("#empty-add-button").addEventListener("click", () => openProgramDialog());
document.querySelector("#close-dialog").addEventListener("click", closeProgramDialog);
document.querySelector("#cancel-dialog").addEventListener("click", closeProgramDialog);
document.querySelector("#cancel-delete").addEventListener("click", () => deleteDialog.close());
searchInput.addEventListener("input", renderPrograms);

programForm.addEventListener("submit", (event) => {
	event.preventDefault();

	const id = document.querySelector("#program-id").value;
	const name = document.querySelector("#program-name").value.trim();
	const miles = parseMiles(document.querySelector("#program-miles").value);
	const membership = document.querySelector("#program-membership").value.trim();

	if (!name) {
		document.querySelector("#program-name").focus();
		return;
	}

	if (id) {
		const program = programs.find((item) => item.id === id);
		if (program) {
			program.name = name;
			program.miles = miles;
			program.membership = membership;
			program.updatedAt = new Date().toISOString();
		}
	} else {
		programs.push({
			id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
			name,
			miles,
			membership,
			updatedAt: new Date().toISOString()
		});
	}

	savePrograms();
	closeProgramDialog();
	renderPrograms();
});

deleteForm.addEventListener("submit", (event) => {
	event.preventDefault();
	programs = programs.filter((program) => program.id !== deletingId);
	savePrograms();
	deletingId = null;
	deleteDialog.close();
	renderPrograms();
});

renderPrograms();
