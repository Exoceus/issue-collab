import React from 'react';
import { formatLabelsForUrl, formatTextToSearch, joinItemsForUrl } from '../utils/formatting';
import { baseUrl, sortOptions } from '../utils/constants';
import './App.scss';
import Header from './core/Header';
import SearchContainer from './search/SearchContainer';
import TogglesContainer from './toggles/TogglesContainer';
import LoadingSpinner from './statuses/LoadingSpinner';
import InitialGreeting from './statuses/InitialGreeting';
import SearchResultsContainer from './search/SearchResultsContainer';

class App extends React.Component {
  state = {
    labels: {
      hacktoberfest: false,
      goodFirstIssue: false,
      helpWanted: false,
      documentation: false,
      bug: false,
      react: false,
    },
    languages: {
      python: false,
      javascript: false,
      php: false,
      java: false,
      ruby: false,
      swift: false,
    },
    fetchError: false,
    isEmpty: true,
    isFetching: false,
    results: {},
    textToSearch: '',
    pageNum: 1,
    isButtonLocked: false,
  };

  getActiveItems = type => {
    const items = this.state[type];
    return Object.keys(items).filter(item => items[item]);
  };

  createUrl = () => {
    const { textToSearch, pageNum } = this.state;
    const formattedText = formatTextToSearch(textToSearch);

    const activeLabels = this.getActiveItems('labels');
    const formattedLabels = formatLabelsForUrl(activeLabels);
    const joinedLabels = joinItemsForUrl(formattedLabels, 'labels');

    const activeLanguage = this.getActiveItems('languages');
    const joinedLanguage = joinItemsForUrl(activeLanguage, 'languages');

    return `${baseUrl}${formattedText}type:issue${joinedLabels}${joinedLanguage}${sortOptions}&page=${pageNum}`;
  };

  handleErrors = res => {
    if (!res.ok) {
      this.setState({ fetchError: true, isFetching: false });
      throw Error(res.status);
    }
    return res.json();
  };

  getIssues = async (shouldResetPageNum = true) => {
    const { isButtonLocked } = this.state;
    if (isButtonLocked) return;

    const preFetchState = {
      isEmpty: true,
      isFetching: true,
      isButtonLocked: true,
    };
    if (shouldResetPageNum) {
      preFetchState.pageNum = 1;
    }
    this.setState(preFetchState);

    const finalUrl = this.createUrl();
    await fetch(finalUrl)
      .then(this.handleErrors)
      .then(resJson => {
        this.setState(
          {
            isEmpty: false,
            isFetching: false,
            results: resJson,
          },
          () =>
            setTimeout(() => {
              this.setState({ isButtonLocked: false });
            }, 3000)
        );
      })
      .catch(() => {
        this.setState({ fetchError: true, isFetching: false, isButtonLocked: false });
      });
  };

  handleTextChange = e => {
    // e.preventDefault();
    // console.log(e.target);
    this.setState({ textToSearch: e.target.value });
    // if (e.key === 'Enter') {
    //   console.log('hi');

    //   this.getIssues();
    // }
  };

  handlePageChange = (e, pageNum) => {
    e.preventDefault();
    e.persist();

    this.setState(
      {
        pageNum,
        isButtonLocked: false,
      },
      () => {
        this.getIssues(e, false);
      }
    );
  };

  toggleLanguage = selectedName => {
    const currentLanguages = this.state.languages;
    Object.keys(currentLanguages).forEach(key => {
      if (key === selectedName) {
        currentLanguages[key] = !currentLanguages[key];
      } else {
        currentLanguages[key] = false;
      }
    });
    return currentLanguages;
  };

  onToggleChange = event => {
    const { labels } = this.state;
    const selectedType = event.target.dataset.type;
    const selectedName = event.target.name;

    if (selectedType === 'label') {
      this.setState({
        labels: { ...labels, [selectedName]: !labels[selectedName] },
      });
    } else if (selectedType === 'language') {
      const updatedLanguages = this.toggleLanguage(selectedName);
      this.setState({
        languages: { ...updatedLanguages },
      });
    }
  };

  resetToggles = toggleType => {
    const currentItems = this.state[toggleType];
    Object.keys(currentItems).forEach(key => {
      currentItems[key] = false;
    });
    return currentItems;
  };

  onReset = () => {
    const resetLabels = this.resetToggles('labels');
    const resetLanguages = this.resetToggles('languages');
    this.setState({
      labels: { ...resetLabels },
      languages: { ...resetLanguages },
      fetchError: false,
      isEmpty: true,
      isLoading: false,
      results: {},
      textToSearch: '',
      pageNum: 1,
      isButtonLocked: false,
    });
  };

  render() {
    const {
      fetchError,
      isButtonLocked,
      isEmpty,
      isFetching,
      labels,
      languages,
      pageNum,
      results,
      textToSearch,
    } = this.state;

    return (
      <div className="app-wrapper">
        <Header />
        <TogglesContainer
          labels={labels}
          languages={languages}
          onToggleChange={this.onToggleChange}
        />
        <SearchContainer
          handleTextChange={this.handleTextChange}
          textToSearch={textToSearch}
          isGetButtonDisabled={isFetching || isButtonLocked}
          getIssues={this.getIssues}
          onReset={this.onReset}
        />

        {isEmpty ? (
          isFetching ? (
            <LoadingSpinner />
          ) : (
            <InitialGreeting hasError={fetchError} />
          )
        ) : (
          <SearchResultsContainer
            results={results}
            onPageChange={this.handlePageChange}
            currentPage={pageNum}
          />
        )}
      </div>
    );
  }
}

export default App;
