export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
export const countObjectValue = (object: Object, value: any) => {
  const array = Object.values(object);
  let count = 0;
  for (let i = 0; i < array.length; ++i) {
    if (array[i] === value) {
      count++;
    }
  }
  return count;
};
export const checktDateFormat = (date: string) => {
  if (typeof date !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  return regex.test(date);
};

export const checktYYYYMMDDFormat = (date: string) => {
  if (typeof date !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  return regex.test(date);
};

export const getLastDayOfMonth = (year:number, month:number) => {
  return new Date(year, month + 1, 0).getDate();
};
