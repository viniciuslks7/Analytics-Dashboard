export const lightTheme = {
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f0f2f5',
    colorText: '#000000',
    colorTextSecondary: '#666666',
    colorBorder: '#d9d9d9',
    colorBgElevated: '#ffffff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1890ff',
  },
};

export const darkTheme = {
  token: {
    colorPrimary: '#177ddc',
    colorBgContainer: '#1f1f1f',
    colorBgLayout: '#141414',
    colorText: '#ffffff',
    colorTextSecondary: '#a0a0a0',
    colorBorder: '#434343',
    colorBgElevated: '#262626',
    colorSuccess: '#49aa19',
    colorWarning: '#d89614',
    colorError: '#d32029',
    colorInfo: '#177ddc',
  },
  algorithm: 'dark' as const,
};

export const getEChartsTheme = (theme: 'light' | 'dark') => {
  if (theme === 'dark') {
    return {
      backgroundColor: '#1f1f1f',
      textStyle: {
        color: '#ffffff',
      },
      title: {
        textStyle: {
          color: '#ffffff',
        },
      },
      legend: {
        textStyle: {
          color: '#ffffff',
        },
      },
      tooltip: {
        backgroundColor: '#262626',
        borderColor: '#434343',
        textStyle: {
          color: '#ffffff',
        },
      },
      axisPointer: {
        lineStyle: {
          color: '#434343',
        },
        crossStyle: {
          color: '#434343',
        },
      },
      grid: {
        borderColor: '#434343',
      },
      categoryAxis: {
        axisLine: {
          lineStyle: {
            color: '#434343',
          },
        },
        axisLabel: {
          color: '#a0a0a0',
        },
        splitLine: {
          lineStyle: {
            color: '#2a2a2a',
          },
        },
      },
      valueAxis: {
        axisLine: {
          lineStyle: {
            color: '#434343',
          },
        },
        axisLabel: {
          color: '#a0a0a0',
        },
        splitLine: {
          lineStyle: {
            color: '#2a2a2a',
          },
        },
      },
      color: [
        '#5470c6',
        '#91cc75',
        '#fac858',
        '#ee6666',
        '#73c0de',
        '#3ba272',
        '#fc8452',
        '#9a60b4',
        '#ea7ccc',
      ],
    };
  }
  
  return {
    backgroundColor: '#ffffff',
    textStyle: {
      color: '#000000',
    },
  };
};
