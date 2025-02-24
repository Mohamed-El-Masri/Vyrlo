export class SearchAutoComplete {
    constructor(inputId, type, suggestions) {
        this.input = document.getElementById(inputId);
        this.type = type;
        this.suggestions = suggestions;
        this.dropdownId = `${inputId}Suggestions`;
        this.setupAutoComplete();
    }

    setupAutoComplete() {
        // تهيئة قائمة الاقتراحات
        this.createDropdown();
        
        // إضافة مستمعي الأحداث
        this.input.addEventListener('input', this.handleInput.bind(this));
        this.input.addEventListener('keydown', this.handleKeydown.bind(this));
        document.addEventListener('click', this.handleClickOutside.bind(this));
    }

    createDropdown() {
        const dropdown = document.createElement('div');
        dropdown.id = this.dropdownId;
        dropdown.className = 'masry-suggestions';
        dropdown.setAttribute('role', 'listbox');
        this.input.parentNode.appendChild(dropdown);
    }

    showSuggestions(items) {
        const dropdown = document.getElementById(this.dropdownId);
        if (!dropdown || !items.length) return;

        const html = items.map((item, index) => `
            <div class="masry-suggestion-item" 
                 role="option" 
                 tabindex="0"
                 data-index="${index}"
                 aria-selected="false">
                <i class="bi ${this.getIcon()}"></i>
                <span>${this.highlightMatch(item, this.input.value)}</span>
            </div>
        `).join('');

        dropdown.innerHTML = html;
        dropdown.style.display = 'block';
    }

    getIcon() {
        switch(this.type) {
            case 'location': return 'bi-geo-alt';
            case 'category': return 'bi-grid';
            default: return 'bi-search';
        }
    }

    highlightMatch(text, query) {
        if (!query) return text;
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }
}
