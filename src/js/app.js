class Component extends DCLogic {
  COLLECTIONS = ['plan', 'publications', 'trips', 'funding', 'todos', 'notes', 'library', 'settings'];

  state = { view: 'dashboard', pubId: null, taskFilter: 'active', data: null, lastEdit: '', server: null, serverError: '', pdfInfo: '', monthOffset: 0, selectedDay: null, editing: false };

  lang() { return ((this.state.data || {}).settings || {}).language || 'pl'; }
  locale() { return this.lang() === 'en' ? 'en-GB' : 'pl-PL'; }
  startYear() { return Number(((this.state.data || {}).settings || {}).startYear || this.props.startYear || 2026); }
  defaultCurrency() { return ((this.state.data || {}).settings || {}).currency || this.props.defaultCurrency || 'PLN'; }

  /* ——— select options: [code, Polish label, English label] ——— */

  OPTIONS = {
    pubTypes: [['article', 'Artykuł', 'Article'], ['conference-paper', 'Referat konferencyjny', 'Conference paper'], ['chapter', 'Rozdział', 'Book chapter'], ['monograph', 'Monografia', 'Monograph'], ['dissertation', 'Rozprawa', 'Dissertation'], ['preprint', 'Preprint', 'Preprint']],
    pubStatuses: [['idea', 'Pomysł', 'Idea'], ['draft', 'Szkic', 'Draft'], ['in-revision', 'W redakcji', 'In revision'], ['submitted', 'Wysłane', 'Submitted'], ['under-review', 'Recenzje', 'Under review'], ['revised', 'Po poprawkach', 'Revised'], ['accepted', 'Przyjęte', 'Accepted'], ['published', 'Opublikowane', 'Published']],
    venueTypes: [['journal', 'Czasopismo', 'Journal'], ['conference', 'Konferencja', 'Conference'], ['workshop', 'Warsztat', 'Workshop'], ['edited-volume', 'Monografia zbiorowa', 'Edited volume']],
    venueStatuses: [['considered', 'Rozważane', 'Considered'], ['in-preparation', 'Przygotowywane', 'In preparation'], ['submitted', 'Wysłane', 'Submitted'], ['under-review', 'Recenzje', 'Under review'], ['accepted', 'Przyjęte', 'Accepted'], ['rejected', 'Odrzucone', 'Rejected']],
    tripTypes: [['conference', 'Konferencja', 'Conference'], ['training', 'Szkolenie', 'Training'], ['secondment', 'Staż', 'Secondment'], ['research-visit', 'Wizyta badawcza', 'Research visit'], ['workshop', 'Warsztat', 'Workshop'], ['other', 'Inne', 'Other']],
    tripStatuses: [['considered', 'Rozważane', 'Considered'], ['applied', 'Zgłoszone', 'Applied'], ['confirmed', 'Potwierdzone', 'Confirmed'], ['settled', 'Rozliczone', 'Settled'], ['cancelled', 'Odwołane', 'Cancelled']],
    fundingTypes: [['grant', 'Grant', 'Grant'], ['scholarship', 'Stypendium', 'Scholarship'], ['award', 'Nagroda', 'Award'], ['travel-grant', 'Dofinansowanie wyjazdu', 'Travel funding'], ['team-project', 'Projekt zespołowy', 'Team project'], ['other', 'Inne', 'Other']],
    fundingStatuses: [['considered', 'Rozważane', 'Considered'], ['in-preparation', 'Przygotowywane', 'In preparation'], ['submitted', 'Złożone', 'Submitted'], ['awarded', 'Przyznane', 'Awarded'], ['rejected', 'Odrzucone', 'Rejected']],
    priorities: [['medium', 'Średni', 'Medium'], ['high', 'Wysoki', 'High'], ['low', 'Niski', 'Low']],
    areas: [['general', 'Ogólne', 'General'], ['plan', 'Plan', 'Plan'], ['publication', 'Publikacja', 'Publication'], ['trip', 'Wyjazd', 'Travel'], ['funding', 'Finansowanie', 'Funding']],
    currencies: [['PLN', 'PLN', 'PLN'], ['EUR', 'EUR', 'EUR']]
  };

  label(group, code) {
    const row = this.OPTIONS[group].find(o => o[0] === code);
    return row ? row[this.lang() === 'en' ? 2 : 1] : code;
  }
  options() {
    const out = {};
    const col = this.lang() === 'en' ? 2 : 1;
    Object.keys(this.OPTIONS).forEach(g => { out[g] = this.OPTIONS[g].map(o => ({ value: o[0], label: o[col] })); });
    return out;
  }

  /* ——— interface texts ——— */

  dict() {
    const en = this.lang() === 'en';
    const P = (pl, eng) => en ? eng : pl;
    return {
      offline: P('Offline · dysk lokalny', 'Offline · local disk'),
      database: P('Lokalna baza danych', 'Local database'),
      autosave: P('autozapis', 'autosave'),
      dataLabel: P('Dane:', 'Data:'),
      module: P('Moduł', 'Module'),
      add: P('Dodaj', 'Add'),
      delete: P('usuń', 'delete'),
      noEntries: P('Brak wpisów.', 'No entries yet.'),
      dashboard: P('Pulpit', 'Dashboard'),
      calendar: P('Kalendarz', 'Calendar'),
      today: P('Dziś', 'Today'),
      noEvents: P('Brak wydarzeń w tym dniu.', 'No events on this day.'),
      upcomingDeadlines: P('Najbliższe terminy', 'Upcoming deadlines'),
      noDatesText: P('Brak wpisanych dat. Terminy z planu, publikacji, wyjazdów, finansowania i listy TODO pojawiają się tutaj automatycznie.', 'No dates yet. Deadlines from the plan, publications, travel, funding and the TODO list appear here automatically.'),
      activeTasks: P('Aktywne TODO', 'Active TODO'),
      noActiveTasks: P('Brak aktywnych zadań.', 'No active tasks.'),
      fullList: P('Cała lista →', 'Full list →'),
      currentPublication: P('Publikacja bieżąca', 'Current publication'),
      openWorkspace: P('Otwórz warsztat →', 'Open workspace →'),
      latestNotes: P('Ostatnie notatki', 'Latest notes'),
      notebookEmpty: P('Notatnik jest pusty.', 'The notebook is empty.'),
      notebookLink: P('Notatnik →', 'Notebook →'),
      planTitle: P('Plan badawczy na 4 lata', 'Four-year research plan'),
      planIntro: P('Lata są puste — wpisz własne etapy. Nazwę fazy roku możesz nadpisać w nagłówku karty. Etap z terminem trafia na listę najbliższych terminów na pulpicie.', 'The years start empty — add your own milestones. You can rename each year’s phase in the card header. A milestone with a date shows up in the dashboard deadlines.'),
      phasePlaceholder: P('nazwa fazy (opcjonalnie)', 'phase name (optional)'),
      deleteMilestone: P('Usuń etap', 'Delete milestone'),
      noMilestones: P('Brak etapów w tym roku.', 'No milestones for this year.'),
      newMilestonePlaceholder: P('Nowy etap…', 'New milestone…'),
      addYear: P('+ Kolejny rok', '+ Another year'),
      publicationsTitle: P('Publikacje', 'Publications'),
      pubIntro: P('Kliknij zakładkę, aby przełączyć tekst. Gwiazdka oznacza publikację bieżącą — tę widać na pulpicie.', 'Click a tab to switch texts. The star marks the current publication — the one shown on the dashboard.'),
      setAsCurrent: P('Ustaw jako bieżącą', 'Set as current'),
      newPublication: P('+ Nowa publikacja', '+ New publication'),
      document: P('Dokument', 'Document'),
      deletePublication: P('Usuń tę publikację', 'Delete this publication'),
      venuesHeading: P('Czasopisma i konferencje', 'Journals and conferences'),
      noVenuesText: P('Brak wpisów. Dodaj czasopismo lub konferencję, do której chcesz wysłać ten tekst.', 'No entries yet. Add a journal or conference you want to submit this text to.'),
      addVenue: P('Dodaj miejsce', 'Add venue'),
      bibEmpty: P('Bibliografia jest pusta.', 'The bibliography is empty.'),
      openPdf: P('Otwórz PDF', 'Open PDF'),
      attachPdf: P('Dołącz plik PDF', 'Attach a PDF'),
      addPdfFiles: P('Dodaj pliki PDF', 'Add PDF files'),
      dropText: P('Przeciągnij tutaj pliki PDF — aplikacja skopiuje je do folderu db/pdf-library.', 'Drop PDF files here — they are copied into the db/pdf-library folder.'),
      libraryEmpty: P('Baza jest pusta. Dodaj PDF-y skanów, artykułów i raportów — powiązanie z wpisem bibliografii jest opcjonalne.', 'The library is empty. Add PDFs of scans, papers and reports — linking them to a bibliography entry is optional.'),
      tripsTitle: P('Wyjazdy, konferencje, szkolenia', 'Travel, conferences, training'),
      plannedCosts: P('Planowane koszty:', 'Planned costs:'),
      newTrip: P('Nowy wyjazd', 'New trip'),
      addTrip: P('Dodaj wyjazd', 'Add trip'),
      fundingTitle: P('Stypendia, granty, finansowanie', 'Scholarships, grants, funding'),
      awardedLabel: P('Przyznane:', 'Awarded:'),
      pendingLabel: P('złożone i przygotowywane:', 'submitted and in preparation:'),
      newFundingSource: P('Nowe źródło finansowania', 'New funding source'),
      todoTitle: P('Lista TODO', 'TODO list'),
      addTask: P('Dodaj zadanie', 'Add task'),
      nothingHere: P('Nic tu nie ma.', 'Nothing here.'),
      notesTitle: P('Notatki bieżące', 'Working notes'),
      newNote: P('+ Nowa notatka', '+ New note'),
      noNotesText: P('Brak notatek. Kliknij „Nowa notatka”.', 'No notes yet. Click “New note”.'),
      settingsTitle: P('Ustawienia', 'Settings'),
      settingsIntro: P('Nazwa projektu pojawia się na pulpicie. Zmiana języka przestawia cały interfejs; wpisane dane pozostają bez zmian.', 'The project name appears on the dashboard. Changing the language switches the whole interface; your entries stay as they are.'),
      project: P('Projekt', 'Project'),
      language: P('Język interfejsu', 'Interface language'),
      languageText: P('Wybierz język etykiet, nagłówków i list rozwijanych.', 'Choose the language of labels, headings and dropdowns.'),
      lProjectName: P('Nazwa projektu (doktoratu)', 'Project (PhD) name'),
      lStartYear: P('Rok rozpoczęcia', 'Starting year'),
      lDefaultCurrency: P('Waluta domyślna', 'Default currency'),
      phProjectName: P('np. Technologie postkwantowe w komunikacji satelitarnej', 'e.g. Post-quantum technologies in satellite communication'),
      lTitle: P('Tytuł', 'Title'), lType: P('Typ', 'Type'), lStatus: P('Status', 'Status'), lName: P('Nazwa', 'Name'),
      lDeadline: P('Deadline', 'Deadline'), lAuthor: P('Autor', 'Author'), lYear: P('Rok', 'Year'), lSource: P('Źródło', 'Source'),
      lShortNote: P('Notka', 'Note'), lDateRange: P('Termin (od–do)', 'Dates (from–to)'), lFrom: P('Od', 'From'), lTo: P('Do', 'To'),
      lAppDeadline: P('Deadline aplikacji', 'Application deadline'), lLink: P('Link', 'Link'), lPlace: P('Miejsce', 'Place'), lCost: P('Koszt', 'Cost'),
      lCurrency: P('Waluta', 'Currency'), lFunding: P('Finansowanie', 'Funding'), lTask: P('Zadanie', 'Task'),
      lPriority: P('Priorytet', 'Priority'), lDue: P('Termin', 'Due date'), lArea: P('Obszar', 'Area'),
      lNote: P('Notatka', 'Note'), lAmount: P('Kwota', 'Amount'), lPoints: P('Punkty / IF', 'Points / IF'),
      lWorkingFile: P('Plik roboczy — ścieżka na dysku', 'Working file — path on disk'),
      lAbstract: P('Abstrakt / teza', 'Abstract / claim'),
      lWorkingNotes: P('Notatki robocze', 'Working notes'),
      lFile: P('Plik', 'File'), lSize: P('Rozmiar', 'Size'),
      lLinkedEntry: P('Powiązany wpis bibliografii', 'Linked bibliography entry'), lAdded: P('Dodano', 'Added'),
      phFile: P('D:\\doktorat\\artykul-1.tex', 'D:\\phd\\paper-1.tex'),
      phPoints: P('punkty / IF', 'points / IF'),
      phPoints2: P('140 pkt', '140 pts'),
      phVenue: P('np. IEEE Trans. on Aerospace and Electronic Systems', 'e.g. IEEE Trans. on Aerospace and Electronic Systems'),
      phAuthor: P('Nazwisko, I.', 'Surname, I.'),
      phSource: P('czasopismo, wydawnictwo', 'journal, publisher'),
      phShortNote: P('do czego przydatne', 'what it is useful for'),
      phLink: P('link (strona wydarzenia)', 'link (event page)'), openLink: P('Otwórz link', 'Open link'),
      appDeadlinePrefix: P('Deadline aplikacji:', 'Application deadline:'),
      phTrip: P('np. IEEE Aerospace Conference', 'e.g. IEEE Aerospace Conference'),
      phCost: P('4500', '4500'),
      phFunding: P('grant, katedra, własne', 'grant, department, own funds'),
      phNote: P('notatka', 'note'),
      phGrant: P('np. NCN Preludium', 'e.g. NCN Preludium'),
      phAmount: P('70000', '70000'),
      phFundingSource: P('NCN, NAWA, ESA, uczelnia', 'NCN, NAWA, ESA, university'),
      phRequirements: P('wymagania, potrzebne dokumenty', 'requirements, documents needed'),
      phTask: P('Co trzeba zrobić?', 'What needs doing?'),
      phNoteTitle: P('Tytuł notatki', 'Note title'),
      phText: P('Treść…', 'Text…'),
      navDashboard: P('Pulpit', 'Dashboard'), navPlan: P('Plan 4 lata', '4-year plan'),
      navPublications: P('Publikacje', 'Publications'), navTrips: P('Wyjazdy', 'Travel'),
      navFunding: P('Finansowanie', 'Funding'), navTodo: P('TODO', 'TODO'),
      navNotes: P('Notatki', 'Notes'), navSettings: P('Ustawienia (Settings)', 'Settings'),
      edit: P('Edytuj wpisy', 'Edit entries'), finishEditing: P('Zakończ edycję', 'Finish editing'),
      editModeOn: P('tryb edycji — pola odblokowane', 'edit mode — fields unlocked'),
      editModeOff: P('wpisy zamrożone', 'entries locked'),
      relToday: P('dziś', 'today'), relTomorrow: P('jutro', 'tomorrow'), relOverdue: P('po terminie', 'overdue'),
      relIn: P('za', 'in'), relDays: P('dni', 'days'), done: P('zrobione', 'done'),
      yearLabel: P('Rok', 'Year'), ofPhd: P('doktoratu', 'of the PhD'), startLabel: P('Start:', 'Start:'),
      planSummary: P('Plan:', 'Plan:'), milestones: P('etapów', 'milestones'), of: P('z', 'of'),
      deadlines30: P('Terminy w ciągu 30 dni:', 'Deadlines within 30 days:'),
      bibliography: P('Bibliografia', 'Bibliography'), entries: P('pozycji', 'entries'),
      venuesConsidered: P('rozważane miejsca publikacji:', 'venues considered:'),
      pdfLibrary: P('Baza dokumentów PDF', 'PDF document library'), files: P('plików', 'files'),
      nextDeadline: P('Najbliższy deadline:', 'Next deadline:'), noSubmissionDate: P('Brak terminu wysyłki', 'No submission date'),
      pdfCopying: P('Kopiowanie plików…', 'Copying files…'),
      pdfNotPdf: P('Pomijam — to nie są pliki PDF.', 'Skipped — these are not PDF files.'),
      pdfSaved: P('Zapisano w folderze db/pdf-library.', 'Saved in the db/pdf-library folder.'),
      notLinked: P('— bez powiązania —', '— not linked —'),
      untitled: P('Bez tytułu', 'Untitled'),
      emptyNote: P('Pusta notatka.', 'Empty note.'),
      noPublications: P('Brak publikacji', 'No publications'),
      newPublicationName: P('Nowa publikacja', 'New publication'),
      seedPublicationTitle: P('Publikacja 1 — tytuł roboczy', 'Publication 1 — working title'),
      active: P('aktywny', 'active'), lastSaved: P('ostatnio', 'last'),
      filterActive: P('Aktywne', 'Active'), filterAll: P('Wszystkie', 'All'), filterDone: P('Zrobione', 'Done'),
      modPlan: P('Plan', 'Plan'), modPublication: P('Publikacja', 'Publication'), modTrip: P('Wyjazd', 'Travel'), modFunding: P('Finansowanie', 'Funding'), modTodo: P('TODO', 'TODO'),
      libraryInfo: P('Pliki PDF zapisują się w folderze db/pdf-library obok aplikacji, a notatki dodatkowo jako pliki .txt w db/notes.', 'PDF files are stored in the db/pdf-library folder next to the app; notes are also written as .txt files in db/notes.'),
      dbFiles: P('pliki db/*.json', 'db/*.json files'),
      dbError: P('BRAK ZAPISU — serwer nie odpowiada', 'NOT SAVED — server not responding'),
      dbNoServer: P('otwarte bez serwera', 'opened without the server'),
      serverDownTitle: P('Brak połączenia z lokalnym serwerem', 'No connection to the local server'),
      serverDownText: P('Zmiany nie są zapisywane w folderze db. Uruchom ponownie start.bat w folderze aplikacji — zaległe zmiany zapiszą się automatycznie, gdy serwer znów zadziała.', 'Changes are not being written to the db folder. Run start.bat in the app folder again — pending changes are saved automatically once the server is back.'),
      fileModeTitle: P('Uruchom aplikację przez start.bat', 'Start the app with start.bat'),
      fileModeText: P('Wszystkie wpisy są zapisywane w plikach JSON w folderze db obok aplikacji, więc aplikacja musi działać przez lokalny serwer. Kliknij dwukrotnie start.bat w folderze aplikacji — otworzy się adres http://localhost:8765, pod którym dane są dostępne w każdej przeglądarce.', 'All entries are stored as JSON files in the db folder next to the app, so it has to run through the local server. Double-click start.bat in the app folder — it opens http://localhost:8765, where your data is available in every browser.'),
      confirmDeletePublication: P('Usunąć publikację „{name}”?', 'Delete the publication “{name}”?'),
      confirmDeletePdf: P('Usunąć „{name}” z bazy? Plik zostanie skasowany także z folderu db/pdf-library.', 'Remove “{name}” from the library? The file is also deleted from the db/pdf-library folder.'),
      pdfSaveFailed: P('Nie udało się zapisać pliku {name}: ', 'Could not save the file {name}: '),
      pdfDeleteFailed: P('Nie udało się usunąć pliku: ', 'Could not delete the file: ')
    };
  }

  /* ——— calendar ——— */

  isoDate(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  calendar(terms) {
    const offset = this.state.monthOffset || 0;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayIso = this.isoDate(today);
    const month = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const byDay = {};
    terms.forEach(t => { (byDay[t.iso] = byDay[t.iso] || []).push(t); });
    const weekdayOfFirst = (month.getDay() + 6) % 7;
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cellCount = Math.ceil((weekdayOfFirst + daysInMonth) / 7) * 7;
    const start = new Date(month); start.setDate(1 - weekdayOfFirst);
    const selected = this.state.selectedDay || todayIso;
    const days = [];
    for (let i = 0; i < cellCount; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const iso = this.isoDate(d);
      const inMonth = d.getMonth() === month.getMonth();
      const events = byDay[iso] || [];
      days.push({
        iso, number: String(d.getDate()),
        fg: inMonth ? 'var(--color-text)' : 'var(--color-neutral-400)',
        bg: iso === selected ? 'var(--color-accent-100)' : 'transparent',
        border: iso === todayIso ? 'var(--color-accent)' : 'var(--color-divider)',
        bar: events.length ? 'var(--color-accent)' : 'transparent',
        count: events.length > 1 ? String(events.length) : '',
        hasEvents: events.length > 0,
        label: d.toLocaleDateString(this.locale(), { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, c => c.toUpperCase()),
        relative: this.relative(iso),
        events: events.map(t => ({ what: t.what, module: t.module })),
        popAlign: i % 7 <= 1 ? 'left' : i % 7 >= 5 ? 'right' : 'center',
        select: () => this.setState({ selectedDay: iso })
      });
    }
    const events = (byDay[selected] || []).map(t => ({ what: t.what, module: t.module }));
    const weekdays = [];
    for (let i = 0; i < 7; i++) weekdays.push({ name: new Date(2024, 0, 1 + i).toLocaleDateString(this.locale(), { weekday: 'short' }) });
    return {
      days, weekdays,
      month: month.toLocaleDateString(this.locale(), { month: 'long', year: 'numeric' }),
      selectedLabel: new Date(selected + 'T00:00:00').toLocaleDateString(this.locale(), { weekday: 'long', day: '2-digit', month: 'long' }),
      events,
      noEvents: events.length === 0,
      prev: () => this.setState({ monthOffset: offset - 1 }),
      next: () => this.setState({ monthOffset: offset + 1 }),
      today: () => this.setState({ monthOffset: 0, selectedDay: todayIso })
    };
  }

  /* ——— lifecycle ——— */

  async componentDidMount() {
    if (this.isFileMode()) {
      // Opened straight from disk (file://) — nothing can be written to the db folder from here.
      this.setState({ server: 'file' });
      return;
    }
    await this.loadFromServer();
    // Changes made in another browser or tab show up when this window regains focus.
    this._onFocus = () => { if (document.visibilityState === 'visible') this.refresh(); };
    document.addEventListener('visibilitychange', this._onFocus);
    window.addEventListener('focus', this._onFocus);
    this._onPageHide = () => this.flushSave(true);
    window.addEventListener('pagehide', this._onPageHide);
  }

  componentWillUnmount() {
    if (this._onFocus) { document.removeEventListener('visibilitychange', this._onFocus); window.removeEventListener('focus', this._onFocus); }
    if (this._onPageHide) window.removeEventListener('pagehide', this._onPageHide);
  }

  /* ——— database: JSON files in the db folder, served by the local server (server.js) ——— */

  isFileMode() { return typeof location !== 'undefined' && location.protocol === 'file:'; }

  async api(path, options) {
    const res = await fetch('/api/' + path, options);
    if (!res.ok) throw new Error((await res.text()) || res.statusText);
    return res;
  }

  async fetchDb() {
    const data = await (await this.api('db', { cache: 'no-store' })).json();
    const empty = this.COLLECTIONS.every(k => !(k in data));
    return { data, empty };
  }

  // Fills in missing collections (e.g. a file deleted by hand) with defaults.
  normalize(data) {
    const seed = this.seed();
    for (const k of this.COLLECTIONS) {
      if (k === 'settings') data[k] = Object.assign({}, seed.settings, data[k] && typeof data[k] === 'object' ? data[k] : {});
      else if (!Array.isArray(data[k])) data[k] = k === 'plan' || k === 'publications' ? seed[k] : [];
    }
    data.publications.forEach(p => { if (!Array.isArray(p.bibliography)) p.bibliography = []; if (!Array.isArray(p.venues)) p.venues = []; });
    data.plan.forEach(y => { if (!Array.isArray(y.milestones)) y.milestones = []; });
    return data;
  }

  applyData(data, extra) {
    const pubId = data.publications.some(p => p.id === this.state.pubId) ? this.state.pubId
      : ((data.publications.find(p => p.current) || data.publications[0]) || {}).id || null;
    this.setState(Object.assign({ data, pubId }, extra || {}));
  }

  markSaved(data) {
    this._saved = {};
    this.COLLECTIONS.forEach(k => { if (k in data) this._saved[k] = JSON.stringify(data[k]); });
  }

  async loadFromServer() {
    try {
      const { data, empty } = await this.fetchDb();
      const normalized = this.normalize(empty ? {} : data);
      this.markSaved(data);
      this._pending = normalized;
      this.applyData(normalized, { server: 'ok' });
      // Empty database or missing files — create the full set in db right away.
      if (this.hasUnsavedChanges()) this.flushSave();
    } catch (e) {
      this.setState({ server: 'down', serverError: e.message });
    }
  }

  hasUnsavedChanges() {
    const d = this._pending;
    return !!d && this.COLLECTIONS.some(k => JSON.stringify(d[k]) !== (this._saved || {})[k]);
  }

  async refresh() {
    if (this._saving || this.hasUnsavedChanges()) return;
    try {
      const { data, empty } = await this.fetchDb();
      if (empty || this._saving || this.hasUnsavedChanges()) return;
      const normalized = this.normalize(data);
      const current = this.state.data;
      if (current && this.COLLECTIONS.every(k => JSON.stringify(current[k]) === JSON.stringify(normalized[k]))) {
        if (this.state.server !== 'ok') this.setState({ server: 'ok' });
        return;
      }
      this.markSaved(normalized);
      this._pending = normalized;
      this.applyData(normalized, { server: 'ok' });
    } catch (e) {
      this.setState({ server: 'down', serverError: e.message });
    }
  }

  scheduleSave(data) {
    this._pending = data;
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.flushSave(), 400);
  }

  // Writes every changed collection to db/<collection>.json.
  async flushSave(leavingPage) {
    clearTimeout(this._saveTimer);
    this._saveTimer = null;
    if (this.isFileMode() || !this._pending) return;
    if (this._saving) { if (!leavingPage) this._saveTimer = setTimeout(() => this.flushSave(), 300); return; }
    this._saving = true;
    try {
      const data = this._pending;
      for (const k of this.COLLECTIONS) {
        const json = JSON.stringify(data[k]);
        if (json === (this._saved || {})[k]) continue;
        await this.api('db/' + k, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: json, keepalive: !!leavingPage && json.length < 60000 });
        this._saved[k] = json;
      }
      this.setState({ server: 'ok', savedAt: new Date().toLocaleTimeString(this.locale(), { hour: '2-digit', minute: '2-digit' }) });
    } catch (e) {
      this.setState({ server: 'down', serverError: e.message });
      if (!leavingPage) this._saveTimer = setTimeout(() => this.flushSave(), 5000);
    } finally {
      this._saving = false;
    }
    if (!leavingPage && !this._saveTimer && this.hasUnsavedChanges()) this._saveTimer = setTimeout(() => this.flushSave(), 300);
  }

  async uploadPdf(file, fileName) {
    const res = await this.api('files?name=' + encodeURIComponent(fileName), { method: 'POST', headers: { 'Content-Type': 'application/pdf' }, body: file });
    return (await res.json()).name;
  }

  /* ——— PDF library ——— */

  freeFileName(name) {
    const used = ((this.state.data || {}).library || []).map(p => p.fileName);
    if (used.indexOf(name) === -1) return name;
    const m = name.match(/^(.*?)(\.pdf)$/i);
    const base = m ? m[1] : name;
    const ext = m ? m[2] : '';
    let i = 2;
    while (used.indexOf(base + ' (' + i + ')' + ext) !== -1) i++;
    return base + ' (' + i + ')' + ext;
  }

  async addPdfs(fileList, bibId) {
    const T = this.dict();
    const files = Array.from(fileList || []).filter(f => f.type === 'application/pdf' || /\.pdf$/i.test(f.name));
    if (!files.length) { this.setState({ pdfInfo: T.pdfNotPdf }); return; }
    this.setState({ pdfInfo: T.pdfCopying });
    let saved = 0;
    for (const f of files) {
      let fileName;
      try { fileName = await this.uploadPdf(f, this.freeFileName(f.name)); } catch (e) { alert(T.pdfSaveFailed.replace('{name}', f.name) + e.message); continue; }
      const rec = { id: this.uid(), fileName, originalName: f.name, size: f.size, bibId: bibId || null, addedAt: new Date().toISOString() };
      this.update(x => { x.library.push(rec); });
      saved++;
    }
    this.setState({ pdfInfo: saved ? T.pdfSaved : '' });
  }

  openPdf(rec) {
    window.open('/api/files/' + encodeURIComponent(rec.fileName), '_blank');
  }

  async deletePdf(rec) {
    const T = this.dict();
    if (!confirm(T.confirmDeletePdf.replace('{name}', rec.fileName))) return;
    try {
      await this.api('files/' + encodeURIComponent(rec.fileName), { method: 'DELETE' });
    } catch (e) { alert(T.pdfDeleteFailed + e.message); return; }
    this.update(x => { x.library = x.library.filter(p => p.id !== rec.id); });
  }

  /* ——— helpers ——— */

  openLink(link) {
    const raw = (link || '').trim();
    if (!raw) return;
    // Only http(s) links; a bare "example.org" gets https:// prepended.
    let url;
    try { url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw); } catch (e) { return; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    window.open(url.href, '_blank', 'noopener');
  }

  setter(collection, id, field) {
    return ev => { const val = ev.target.value; this.update(x => { const q = x[collection].find(z => z.id === id); if (q) q[field] = val; }); };
  }

  sizeText(bytes) {
    const n = Number(bytes) || 0;
    if (n > 1048576) return (n / 1048576).toFixed(1) + ' MB';
    return Math.max(1, Math.round(n / 1024)) + ' kB';
  }

  uid() { return Math.random().toString(36).slice(2, 9); }

  seed() {
    return {
      plan: [0, 1, 2, 3].map(() => ({ id: this.uid(), phase: '', milestones: [] })),
      publications: [{ id: this.uid(), current: true, title: this.dict().seedPublicationTitle, type: 'article', status: 'idea', file: '', abstract: '', notes: '', bibliography: [], venues: [] }],
      trips: [],
      funding: [],
      todos: [],
      notes: [],
      library: [],
      settings: { projectName: '', language: 'pl', startYear: Number(this.props.startYear || 2026), currency: this.props.defaultCurrency || 'PLN' }
    };
  }

  update(fn) {
    this.setState(s => {
      const data = JSON.parse(JSON.stringify(s.data));
      fn(data);
      this.scheduleSave(data);
      return { data, lastEdit: new Date().toLocaleTimeString(this.locale(), { hour: '2-digit', minute: '2-digit' }) };
    });
  }

  ref(name) {
    this._refFns = this._refFns || {}; this._refEls = this._refEls || {};
    if (!this._refFns[name]) this._refFns[name] = el => { this._refEls[name] = el; };
    return this._refFns[name];
  }
  val(name) { const el = (this._refEls || {})[name]; return el ? String(el.value).trim() : ''; }
  clear() { for (const name of arguments) { const el = (this._refEls || {})[name]; if (el) el.value = ''; } }

  number(v) { const n = Number(String(v).replace(/\s|,/g, '')); return isNaN(n) ? 0 : n; }
  totals(items) {
    const sums = {};
    items.forEach(x => { const n = this.number(x.amount); if (!n) return; const c = x.currency || 'PLN'; sums[c] = (sums[c] || 0) + n; });
    const keys = Object.keys(sums);
    if (!keys.length) return '—';
    return keys.map(c => sums[c].toLocaleString(this.locale()) + ' ' + c).join(' · ');
  }
  daysUntil(iso) {
    if (!iso) return null;
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return null;
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return Math.round((d - t) / 86400000);
  }
  formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return '—';
    return d.toLocaleDateString(this.locale(), { day: '2-digit', month: 'short', year: 'numeric' });
  }
  relative(iso) {
    const n = this.daysUntil(iso);
    if (n === null) return '';
    const T = this.dict();
    if (n === 0) return T.relToday;
    if (n < 0) return T.relOverdue;
    if (n === 1) return T.relTomorrow;
    return T.relIn + ' ' + n + ' ' + T.relDays;
  }
  dueColor(iso) {
    const n = this.daysUntil(iso);
    if (n === null) return 'var(--color-neutral-600)';
    if (n < 0) return 'var(--color-danger)';
    if (n <= 14) return 'var(--color-accent-700)';
    return 'var(--color-neutral-600)';
  }
  roman(i) { return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i] || String(i + 1); }
  yearLabel(i) {
    const y = this.startYear() + i;
    return this.dict().yearLabel + ' ' + this.roman(i) + ' · ' + y + '/' + String((y + 1) % 100).padStart(2, '0');
  }
  phdStage() {
    const T = this.dict();
    const start = new Date(this.startYear(), 9, 1);
    const now = new Date();
    if (now < start) return T.startLabel + ' ' + start.toLocaleDateString(this.locale(), { month: 'long', year: 'numeric' });
    const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    return T.yearLabel + ' ' + this.roman(Math.floor(months / 12)) + ' ' + T.ofPhd;
  }

  /* ——— view model ——— */

  renderVals() {
    const d = this.state.data;
    const R = {};
    ['venueName', 'venueType', 'venueDeadline', 'venuePoints', 'venueStatus', 'bibAuthor', 'bibYear', 'bibTitle', 'bibSource', 'bibNote',
     'tripName', 'tripType', 'tripDeadline', 'tripDate', 'tripEndDate', 'tripPlace', 'tripLink', 'tripCost', 'tripCurrency', 'tripFunding', 'tripStatus',
     'fundName', 'fundType', 'fundDeadline', 'fundAmount', 'fundCurrency', 'fundSource', 'fundStatus', 'fundNote',
     'taskText', 'taskPriority', 'taskDue', 'taskArea', 'pdfFiles'].forEach(n => { R[n] = this.ref(n); });

    const view = this.state.view;
    const v = { dashboard: view === 'dashboard', plan: view === 'plan', publications: view === 'publications', trips: view === 'trips', funding: view === 'funding', todo: view === 'todo', notes: view === 'notes', settings: view === 'settings' };
    const T = this.dict();
    const server = this.state.server;
    const settings = (d || {}).settings || {};
    const base = {
      r: R, v,
      t: T, options: this.options(),
      projectName: settings.projectName || this.props.projectName || 'Technologie postkwantowe w komunikacji satelitarnej',
      defaultCurrency: this.defaultCurrency(),
      phdStage: this.phdStage(),
      saveInfo: this.state.lastEdit ? T.lastSaved + ' ' + this.state.lastEdit : T.active,
      dbInfo: server === 'ok' ? T.dbFiles + (this.state.savedAt ? ' · ' + this.state.savedAt : '')
        : server === 'down' ? T.dbError : server === 'file' ? T.dbNoServer : '',
      dataFolder: 'db',
      banner: server === 'down' || server === 'file',
      bannerTitle: server === 'file' ? T.fileModeTitle : T.serverDownTitle,
      bannerText: server === 'file' ? T.fileModeText : T.serverDownText + (this.state.serverError ? ' (' + this.state.serverError + ')' : ''),
      settings: {
        projectName: settings.projectName || '',
        startYear: String(this.startYear()),
        currency: this.defaultCurrency(),
        setProjectName: ev => { const val = ev.target.value; this.update(x => { x.settings.projectName = val; }); },
        setStartYear: ev => { const val = ev.target.value; this.update(x => { x.settings.startYear = Number(val) || 2026; }); },
        setCurrency: ev => { const val = ev.target.value; this.update(x => { x.settings.currency = val; }); },
        languages: [['pl', 'Polski'], ['en', 'English']].map(([code, label]) => ({
          label,
          go: () => this.update(x => { x.settings.language = code; }),
          fg: this.lang() === code ? 'var(--color-accent-700)' : 'var(--color-text)',
          bg: this.lang() === code ? 'var(--color-accent-100)' : 'var(--color-bg)'
        }))
      },
      goPublications: () => this.setState({ view: 'publications' }),
      goTodo: () => this.setState({ view: 'todo' }),
      goNotes: () => this.setState({ view: 'notes' })
    };
    if (!d) return base;

    const openTasks = d.todos.filter(t => !t.done);
    const milestonesDone = d.plan.reduce((a, y) => a + y.milestones.filter(m => m.done).length, 0);
    const milestonesTotal = d.plan.reduce((a, y) => a + y.milestones.length, 0);
    const navDef = [
      ['dashboard', T.navDashboard, ''],
      ['plan', T.navPlan, milestonesDone + '/' + milestonesTotal],
      ['publications', T.navPublications, String(d.publications.length)],
      ['trips', T.navTrips, String(d.trips.length)],
      ['funding', T.navFunding, String(d.funding.length)],
      ['todo', T.navTodo, String(openTasks.length)],
      ['notes', T.navNotes, String(d.notes.length)],
      ['settings', T.navSettings, '']
    ];
    const nav = navDef.map(([id, label, count]) => ({
      id, label, count,
      go: () => this.setState({ view: id }),
      fg: view === id ? 'var(--color-text)' : 'var(--color-neutral-700)',
      bg: view === id ? 'var(--color-active)' : 'transparent'
    }));

    const plan = d.plan.map((year, i) => {
      const done = year.milestones.filter(m => m.done).length;
      const total = year.milestones.length;
      const findMilestone = (x, id) => x.plan.find(p => p.id === year.id).milestones.find(q => q.id === id);
      return {
        id: year.id, label: this.yearLabel(i), phase: year.phase || '',
        progress: done + '/' + total,
        pct: total ? Math.round((done / total) * 100) + '%' : '0%',
        empty: total === 0,
        ref: this.ref('milestone_' + year.id),
        add: () => this.addMilestone(year.id),
        keyDown: e => { if (e.key === 'Enter') this.addMilestone(year.id); },
        setPhase: ev => { const val = ev.target.value; this.update(x => { x.plan.find(p => p.id === year.id).phase = val; }); },
        milestones: year.milestones.map(m => ({
          id: m.id, text: m.text, due: m.due || '',
          mark: m.done ? '✓' : '',
          checkBg: m.done ? 'var(--color-accent)' : 'transparent',
          deco: m.done ? 'line-through' : 'none',
          op: m.done ? 0.5 : 1,
          relative: m.done ? T.done : this.relative(m.due),
          color: m.done ? 'var(--color-neutral-600)' : this.dueColor(m.due),
          setText: ev => { const val = ev.target.value; this.update(x => { findMilestone(x, m.id).text = val; }); },
          toggle: () => this.update(x => { const q = findMilestone(x, m.id); q.done = !q.done; }),
          setDue: ev => { const val = ev.target.value; this.update(x => { findMilestone(x, m.id).due = val; }); },
          remove: () => this.update(x => { const y = x.plan.find(p => p.id === year.id); y.milestones = y.milestones.filter(q => q.id !== m.id); })
        }))
      };
    });

    const pubRaw = d.publications.find(p => p.id === this.state.pubId) || d.publications.find(p => p.current) || d.publications[0] || null;
    const currentRaw = d.publications.find(p => p.current) || pubRaw;
    const setPub = field => ev => { const val = ev.target.value; this.update(x => { x.publications.find(q => q.id === pubRaw.id)[field] = val; }); };
    const setPubItem = (pubId, list, id, field) => ev => {
      const val = ev.target.value;
      this.update(x => { const q = x.publications.find(z => z.id === pubId)[list].find(z => z.id === id); if (q) q[field] = val; });
    };
    const venuesVm = p => p.venues.map(c => ({
      name: c.name, type: c.type, points: c.points || '', status: c.status, deadline: c.deadline || '',
      relative: this.relative(c.deadline), color: this.dueColor(c.deadline),
      setName: setPubItem(p.id, 'venues', c.id, 'name'), setType: setPubItem(p.id, 'venues', c.id, 'type'),
      setDeadline: setPubItem(p.id, 'venues', c.id, 'deadline'), setPoints: setPubItem(p.id, 'venues', c.id, 'points'),
      setStatus: setPubItem(p.id, 'venues', c.id, 'status'),
      remove: () => this.update(x => { const q = x.publications.find(z => z.id === p.id); q.venues = q.venues.filter(z => z.id !== c.id); })
    }));
    const pub = pubRaw ? {
      id: pubRaw.id, title: pubRaw.title, type: pubRaw.type, status: pubRaw.status,
      file: pubRaw.file || '', abstract: pubRaw.abstract || '', notes: pubRaw.notes || '',
      noBibliography: pubRaw.bibliography.length === 0, noVenues: pubRaw.venues.length === 0,
      statusLabel: this.label('pubStatuses', pubRaw.status), typeLabel: this.label('pubTypes', pubRaw.type),
      bibHeading: T.bibliography + ' — ' + pubRaw.bibliography.length + ' ' + T.entries,
      summary: T.bibliography + ': ' + pubRaw.bibliography.length + ' ' + T.entries + ' · ' + T.venuesConsidered + ' ' + pubRaw.venues.length,
      setTitle: setPub('title'), setType: setPub('type'), setStatus: setPub('status'),
      setFile: setPub('file'), setAbstract: setPub('abstract'), setNotes: setPub('notes'),
      remove: () => {
        if (!confirm(T.confirmDeletePublication.replace('{name}', pubRaw.title))) return;
        this.update(x => { x.publications = x.publications.filter(q => q.id !== pubRaw.id); });
        this.setState({ pubId: null });
      },
      bibliography: pubRaw.bibliography.map(b => ({
        author: b.author, year: b.year, title: b.title, source: b.source, note: b.note || '',
        setAuthor: setPubItem(pubRaw.id, 'bibliography', b.id, 'author'), setYear: setPubItem(pubRaw.id, 'bibliography', b.id, 'year'),
        setTitle: setPubItem(pubRaw.id, 'bibliography', b.id, 'title'), setSource: setPubItem(pubRaw.id, 'bibliography', b.id, 'source'),
        setNote: setPubItem(pubRaw.id, 'bibliography', b.id, 'note'),
        pdfs: d.library.filter(p => p.bibId === b.id).map(p => ({ name: p.fileName, open: () => this.openPdf(p) })),
        ref: this.ref('pdf_' + b.id),
        pickPdf: () => { const el = (this._refEls || {})['pdf_' + b.id]; if (el) el.click(); },
        loadPdf: ev => { this.addPdfs(ev.target.files, b.id); ev.target.value = ''; },
        remove: () => this.update(x => { const p = x.publications.find(q => q.id === pubRaw.id); p.bibliography = p.bibliography.filter(q => q.id !== b.id); })
      })),
      venues: venuesVm(pubRaw)
    } : { title: T.noPublications, type: '—', status: '—', noBibliography: true, noVenues: true, bibliography: [], venues: [] };

    if (currentRaw) {
      const next = currentRaw.venues.filter(c => c.deadline).sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
      pub.nextDeadline = next ? T.nextDeadline + ' ' + next.name + ' — ' + this.formatDate(next.deadline) : T.noSubmissionDate;
    }
    const dashboardPub = currentRaw ? {
      title: currentRaw.title, type: currentRaw.type, status: currentRaw.status,
      typeLabel: this.label('pubTypes', currentRaw.type), statusLabel: this.label('pubStatuses', currentRaw.status),
      summary: T.bibliography + ': ' + currentRaw.bibliography.length + ' ' + T.entries + ' · ' + T.venuesConsidered + ' ' + currentRaw.venues.length,
      nextDeadline: pub.nextDeadline
    } : null;

    const publicationTabs = d.publications.map(p => ({
      label: p.title || T.untitled,
      star: p.current ? '★' : '☆',
      select: () => this.setState({ pubId: p.id }),
      markCurrent: () => this.update(x => { x.publications.forEach(q => { q.current = q.id === p.id; }); }),
      fg: p.id === (pubRaw || {}).id ? 'var(--color-accent-700)' : 'var(--color-text)',
      starFg: p.current ? 'var(--color-accent)' : 'var(--color-neutral-500)',
      bg: p.id === (pubRaw || {}).id ? 'var(--color-accent-100)' : 'var(--color-bg)'
    }));

    const trips = d.trips.map(w => ({
      name: w.name, type: w.type, date: w.date || '', endDate: w.endDate || '', deadline: w.deadline || '',
      link: w.link || '', place: w.place || '', funding: w.funding || '',
      status: w.status, cost: w.cost || '', currency: w.currency || 'PLN',
      relative: this.relative(w.date), color: this.dueColor(w.date),
      deadlineRelative: this.relative(w.deadline), deadlineColor: this.dueColor(w.deadline),
      endBorder: w.date && w.endDate && w.endDate < w.date ? 'var(--color-accent-900)' : 'transparent',
      noLink: !w.link, linkOpacity: w.link ? 1 : 0.3,
      openLink: () => this.openLink(w.link),
      setDeadline: this.setter('trips', w.id, 'deadline'), setEndDate: this.setter('trips', w.id, 'endDate'),
      setLink: this.setter('trips', w.id, 'link'),
      setName: this.setter('trips', w.id, 'name'), setType: this.setter('trips', w.id, 'type'),
      setDate: this.setter('trips', w.id, 'date'), setPlace: this.setter('trips', w.id, 'place'),
      setCost: this.setter('trips', w.id, 'cost'), setCurrency: this.setter('trips', w.id, 'currency'),
      setFunding: this.setter('trips', w.id, 'funding'), setStatus: this.setter('trips', w.id, 'status'),
      remove: () => this.update(x => { x.trips = x.trips.filter(q => q.id !== w.id); })
    }));

    const funding = d.funding.map(f => ({
      name: f.name, type: f.type, source: f.source || '', note: f.note || '', status: f.status,
      deadline: f.deadline || '', amount: f.amount || '', currency: f.currency || 'PLN',
      relative: this.relative(f.deadline), color: this.dueColor(f.deadline),
      setName: this.setter('funding', f.id, 'name'), setType: this.setter('funding', f.id, 'type'),
      setDeadline: this.setter('funding', f.id, 'deadline'), setAmount: this.setter('funding', f.id, 'amount'),
      setCurrency: this.setter('funding', f.id, 'currency'), setSource: this.setter('funding', f.id, 'source'),
      setNote: this.setter('funding', f.id, 'note'), setStatus: this.setter('funding', f.id, 'status'),
      remove: () => this.update(x => { x.funding = x.funding.filter(q => q.id !== f.id); })
    }));

    const filter = this.state.taskFilter;
    const filtered = filter === 'all' ? d.todos : filter === 'done' ? d.todos.filter(t => t.done) : openTasks;
    const taskVm = t => ({
      text: t.text, priority: t.priority, area: t.area || 'general', due: t.due || '',
      priorityLabel: this.label('priorities', t.priority),
      setText: this.setter('todos', t.id, 'text'), setPriority: this.setter('todos', t.id, 'priority'),
      setArea: this.setter('todos', t.id, 'area'), setDue: this.setter('todos', t.id, 'due'),
      mark: t.done ? '✓' : '', checkBg: t.done ? 'var(--color-accent)' : 'transparent',
      deco: t.done ? 'line-through' : 'none', op: t.done ? 0.5 : 1,
      dueShort: t.due ? this.relative(t.due) : '',
      relative: t.done ? T.done : t.due ? this.relative(t.due) : '',
      color: this.dueColor(t.due),
      toggle: () => this.update(x => { const q = x.todos.find(z => z.id === t.id); q.done = !q.done; }),
      remove: () => this.update(x => { x.todos = x.todos.filter(z => z.id !== t.id); })
    });

    const notes = d.notes.map(n => ({
      title: n.title, text: n.text,
      date: new Date(n.date).toLocaleString(this.locale(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      setTitle: this.setter('notes', n.id, 'title'),
      setText: this.setter('notes', n.id, 'text'),
      remove: () => this.update(x => { x.notes = x.notes.filter(q => q.id !== n.id); })
    }));

    // Everything with a date, for the dashboard list and the calendar.
    const terms = [];
    d.publications.forEach(p => p.venues.forEach(c => { if (c.deadline && c.status !== 'rejected') terms.push({ what: c.name + ' — ' + p.title, module: T.modPublication, iso: c.deadline }); }));
    d.funding.forEach(f => { if (f.deadline && f.status !== 'rejected') terms.push({ what: f.name, module: T.modFunding, iso: f.deadline }); });
    d.trips.forEach(w => {
      if (w.date) terms.push({ what: w.name, module: T.modTrip, iso: w.date });
      if (w.deadline && w.status === 'considered') terms.push({ what: T.appDeadlinePrefix + ' ' + w.name, module: T.modTrip, iso: w.deadline });
    });
    openTasks.forEach(t => { if (t.due) terms.push({ what: t.text, module: T.modTodo, iso: t.due }); });
    d.plan.forEach(y => y.milestones.forEach(m => { if (m.due && !m.done) terms.push({ what: m.text, module: T.modPlan, iso: m.due }); }));
    terms.sort((a, b) => a.iso.localeCompare(b.iso));
    const within30Days = terms.filter(x => { const n = this.daysUntil(x.iso); return n !== null && n >= 0 && n <= 30; }).length;

    return {
      ...base, nav, plan, pub: dashboardPub && v.dashboard ? { ...pub, ...dashboardPub } : pub,
      publicationTabs, trips, funding, notes,
      planSummary: T.planSummary + ' ' + milestonesDone + ' ' + T.of + ' ' + milestonesTotal + ' ' + T.milestones,
      deadlinesSummary: T.deadlines30 + ' ' + within30Days,
      libraryHeading: T.pdfLibrary + ' — ' + d.library.length + ' ' + T.files,
      cal: this.calendar(terms),
      upcoming: terms.slice(0, 6).map(t => ({ what: t.what, module: t.module, date: this.formatDate(t.iso), relative: this.relative(t.iso), color: this.dueColor(t.iso) })),
      noDeadlines: terms.length === 0,
      activeTasks: openTasks.slice(0, 6).map(taskVm),
      noActiveTasks: openTasks.length === 0,
      tasks: filtered.map(taskVm),
      noFilteredTasks: filtered.length === 0,
      filters: [['active', T.filterActive], ['all', T.filterAll], ['done', T.filterDone]].map(([code, label]) => ({
        label, go: () => this.setState({ taskFilter: code }),
        fg: filter === code ? 'var(--color-accent-700)' : 'var(--color-text)',
        bg: filter === code ? 'var(--color-accent-100)' : 'var(--color-bg)'
      })),
      latestNotes: d.notes.slice(0, 3).map(n => ({
        title: n.title || T.untitled,
        excerpt: (n.text || '').slice(0, 120) || T.emptyNote,
        date: new Date(n.date).toLocaleDateString(this.locale(), { day: '2-digit', month: 'short', year: 'numeric' })
      })),
      noTrips: d.trips.length === 0,
      noFunding: d.funding.length === 0,
      noNotes: d.notes.length === 0,
      totalCosts: this.totals(d.trips.filter(w => w.status !== 'cancelled').map(w => ({ amount: w.cost, currency: w.currency }))),
      totalAwarded: this.totals(d.funding.filter(f => f.status === 'awarded').map(f => ({ amount: f.amount, currency: f.currency }))),
      totalPending: this.totals(d.funding.filter(f => f.status === 'submitted' || f.status === 'in-preparation').map(f => ({ amount: f.amount, currency: f.currency }))),
      addYear: () => this.update(x => { x.plan.push({ id: this.uid(), phase: '', milestones: [] }); }),
      addPublication: () => {
        const id = this.uid();
        this.update(x => { x.publications.push({ id, current: false, title: T.newPublicationName, type: 'article', status: 'idea', file: '', abstract: '', notes: '', bibliography: [], venues: [] }); });
        this.setState({ pubId: id });
      },
      addVenue: () => {
        const name = this.val('venueName'); if (!name || !pubRaw) return;
        const rec = { id: this.uid(), name, type: this.val('venueType') || 'journal', deadline: this.val('venueDeadline'), points: this.val('venuePoints'), status: this.val('venueStatus') || 'considered' };
        this.update(x => { x.publications.find(q => q.id === pubRaw.id).venues.push(rec); });
        this.clear('venueName', 'venueDeadline', 'venuePoints');
      },
      libraryInfo: T.libraryInfo,
      pdfInfo: this.state.pdfInfo,
      locked: !this.state.editing,
      editButtonLabel: this.state.editing ? T.finishEditing : T.edit,
      editButtonClass: this.state.editing ? 'btn btn-primary btn-block' : 'btn btn-secondary btn-block',
      editModeText: this.state.editing ? T.editModeOn : T.editModeOff,
      toggleEdit: () => this.setState({ editing: !this.state.editing }),
      pickPdfFiles: () => { const el = (this._refEls || {}).pdfFiles; if (el) el.click(); },
      loadPdfFiles: ev => { this.addPdfs(ev.target.files, null); ev.target.value = ''; },
      dropFiles: ev => { ev.preventDefault(); this.addPdfs(ev.dataTransfer.files, null); },
      dragOver: ev => { ev.preventDefault(); },
      noPdfs: d.library.length === 0,
      bibOptions: [{ value: '', label: T.notLinked }].concat(pubRaw ? pubRaw.bibliography.map(b => ({ value: b.id, label: (b.author ? b.author + ' ' : '') + (b.year ? '(' + b.year + ') ' : '') + b.title })) : []),
      library: d.library.map(p => {
        const entry = d.publications.reduce((a, q) => a.concat(q.bibliography), []).find(b => b.id === p.bibId);
        return {
          name: p.fileName, size: this.sizeText(p.size),
          bibId: p.bibId || '',
          linkedEntry: entry ? (entry.author ? entry.author + ' — ' : '') + entry.title : '—',
          date: this.formatDate(String(p.addedAt).slice(0, 10)),
          open: () => this.openPdf(p),
          remove: () => this.deletePdf(p),
          setBib: ev => { const val = ev.target.value; this.update(x => { x.library.find(q => q.id === p.id).bibId = val || null; }); }
        };
      }),
      addBibEntry: () => this.addBibEntry(pubRaw),
      bibKeyDown: e => { if (e.key === 'Enter') this.addBibEntry(pubRaw); },
      addTrip: () => {
        const name = this.val('tripName'); if (!name) return;
        const rec = { id: this.uid(), name, type: this.val('tripType') || 'conference', deadline: this.val('tripDeadline'), date: this.val('tripDate'), endDate: this.val('tripEndDate'), place: this.val('tripPlace'), link: this.val('tripLink'), cost: this.val('tripCost'), currency: this.val('tripCurrency') || 'PLN', funding: this.val('tripFunding'), status: this.val('tripStatus') || 'considered' };
        this.update(x => { x.trips.push(rec); });
        this.clear('tripName', 'tripDeadline', 'tripDate', 'tripEndDate', 'tripPlace', 'tripLink', 'tripCost', 'tripFunding');
      },
      addFunding: () => {
        const name = this.val('fundName'); if (!name) return;
        const rec = { id: this.uid(), name, type: this.val('fundType') || 'grant', deadline: this.val('fundDeadline'), amount: this.val('fundAmount'), currency: this.val('fundCurrency') || 'PLN', source: this.val('fundSource'), status: this.val('fundStatus') || 'considered', note: this.val('fundNote') };
        this.update(x => { x.funding.push(rec); });
        this.clear('fundName', 'fundDeadline', 'fundAmount', 'fundSource', 'fundNote');
      },
      addTask: () => this.addTask(),
      taskKeyDown: e => { if (e.key === 'Enter') this.addTask(); },
      addNote: () => this.update(x => { x.notes.unshift({ id: this.uid(), title: '', text: '', date: new Date().toISOString() }); })
    };
  }

  addBibEntry(pubRaw) {
    const title = this.val('bibTitle');
    if (!title || !pubRaw) return;
    const rec = { id: this.uid(), author: this.val('bibAuthor'), year: this.val('bibYear'), title, source: this.val('bibSource'), note: this.val('bibNote') };
    this.update(x => { x.publications.find(q => q.id === pubRaw.id).bibliography.push(rec); });
    this.clear('bibAuthor', 'bibYear', 'bibTitle', 'bibSource', 'bibNote');
  }

  addMilestone(yearId) {
    const name = 'milestone_' + yearId;
    const text = this.val(name);
    if (!text) return;
    this.update(x => { x.plan.find(p => p.id === yearId).milestones.push({ id: this.uid(), text, done: false, due: '' }); });
    this.clear(name);
  }

  addTask() {
    const text = this.val('taskText');
    if (!text) return;
    const rec = { id: this.uid(), text, done: false, priority: this.val('taskPriority') || 'medium', due: this.val('taskDue'), area: this.val('taskArea') || 'general' };
    this.update(x => { x.todos.push(rec); });
    this.clear('taskText', 'taskDue');
  }
}
