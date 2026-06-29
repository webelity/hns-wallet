export function getPageIndices(transactions, itemsPerPage, currentPageIndex) {
  const totals = Math.ceil(transactions.length / itemsPerPage);

  if (totals < 7) {
    return Array(totals)
      .fill(0)
      .map((_, n) => n);
  }

  // If totals >= 7, we want a fixed length of 7 elements to prevent layout shifting
  if (currentPageIndex <= 2) {
    // Near start: 1, 2, 3, 4, 5, ..., total
    return [0, 1, 2, 3, 4, '...', totals - 1];
  } else if (currentPageIndex >= totals - 3) {
    // Near end: 1, ..., total-4, total-3, total-2, total-1, total
    return [0, '...', totals - 5, totals - 4, totals - 3, totals - 2, totals - 1];
  } else {
    // Middle: 1, ..., current-1, current, current+1, ..., total
    return [0, '...', currentPageIndex - 1, currentPageIndex, currentPageIndex + 1, '...', totals - 1];
  }
}
