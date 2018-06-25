import './style.css';

import 'headjs/src/2.0.0/load'

import Reveal from 'reveal'
import 'reveal/index.css'
import 'reveal/theme/default.css'

import Highcharts from 'highcharts'
// require('highcharts/js/themes/dark-unica')(Highcharts)
require('highcharts/modules/exporting')(Highcharts)

const data = [
  'counts',
  'commitsOverTheTime',
  'linksOverTime',

  'activeLinksByCategory',
  'inactiveLinksByCategory',
  'contributorsByCategory',

  'contributorsByList',
  'activeLinksByList',
  'inactiveLinksByList',

  'commitsByUser',
  'activeLinksByUser',
  'inactiveLinksByUser',

  'topListByContributors',
  'topListByCommits',
  'topListByLinks',

  'topUserByLists',
  'topUserByCommits',
  'topUserByLinks',

  'topLink'
].reduce((acc, key) => {
  acc[key] = require(`../data/${key}.json`)
  return acc
}, {})

for (let $el of Array.from(document.querySelectorAll('[data-var]'))) {
  const varName = $el.dataset.var
  $el.innerText = varName
    .split('.')
    .reduce((acc, key) => {
      return acc && acc[key]
    }, data) || $el.dataset.default
}

Reveal.initialize({
  dependencies: [
		{
      src: './app/js/highlight.js',
      async: true,
      callback: function() {
        hljs.initHighlightingOnLoad()
      }
    },
	]
})

const charts = {
  linksAndCommitsOverTime () {
    const categories = Array.from(
      new Set(
        data.linksOverTime.map(({ monthYear }) => monthYear)
          .concat(data.commitsOverTheTime.map(({ monthYear }) => monthYear))
      )
    ).sort()

    const links = categories.map(category => {
      const found = data.linksOverTime.find(({ monthYear }) => monthYear === category)
      return found ? found.links : null
    })

    const commits = categories.map(category => {
      const found = data.commitsOverTheTime.find(({ monthYear }) => monthYear === category)
      return found ? found.commits : null
    })

    Highcharts.chart(containerForChart('linksAndCommitsOverTime'), {
      chart: {
        type: 'area'
      },
      title: {
        text: 'Links e Commits ao decorrer do tempo'
      },
      xAxis: {
        categories
      },
      yAxis: {
        title: {
          text: 'Quantidade'
        }
      },
      series: [{
        name: 'Links',
        data: links
      }, {
        name: 'Commits',
        data: data.commitsOverTheTime.map(({ commits }) => commits)
      }],
      credits: { enabled: false },
      exporting: { enabled: false }
    })
  },

  linksByCategory () {
    const categories = data.activeLinksByCategory.map(({ name }) => name)

    const active = data.activeLinksByCategory.map(({ links }) => links)
    const inactive = categories.map(category =>
      data.inactiveLinksByCategory.find(({ name }) => name === category).links
    )

    Highcharts.chart(containerForChart('linksByCategory'), {
      chart: {
        type: 'bar',
        height: 720
      },
      title: {
        text: 'Links por categoria'
      },
      xAxis: {
        categories,
        title: {
          text: null
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Links',
          align: 'high'
        },
        labels: {
          overflow: 'justify'
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
        shadow: true
      },
      series: [{
        name: 'Ativos',
        data: active
      }, {
        name: 'Removidos',
        data: inactive
      }],
      credits: { enabled: false },
      exporting: { enabled: false }
    })
  },

  contributorsByCategory () {
    Highcharts.chart(containerForChart('contributorsByCategory'), {
      chart: {
        plotBackgroundColor: null,
        plotBorderWidth: null,
        plotShadow: false,
        type: 'pie'
      },
      title: {
        text: 'Contribuidores por categoria'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.y}',
            style: {
              color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
            }
          }
        }
      },
      series: [{
        name: 'Brands',
        colorByPoint: true,
        data: data.contributorsByCategory.map(({ name, contributors }) => ({
          name,
          y: contributors,
        }))
      }],
      credits: { enabled: false },
      exporting: { enabled: false }
    })
  },

  topListByContributors () {
    const categories = data.topListByContributors.map(({ owner, name }) => `${owner}/${name}`)

    Highcharts.chart(containerForChart('topListByContributors'), {
      chart: {
        type: 'bar',
        height: 720
      },
      title: {
        text: 'Top listas por contribuidores'
      },
      xAxis: {
        categories,
        title: {
          text: null
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Contribuidores',
          align: 'high'
        },
        labels: {
          overflow: 'justify'
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true
          }
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
        shadow: true
      },
      series: [{
        name: 'Contribuidores',
        data: data.topListByContributors.map(({ contributors }) => contributors)
      }],
      credits: { enabled: false },
      exporting: { enabled: false }
    })
  },

  topListByCommits () {
    const categories = data.topListByCommits.map(({ owner, name }) => `${owner}/${name}`)

    Highcharts.chart(containerForChart('topListByCommits'), {
      chart: {
        type: 'bar',
        height: 720
      },
      title: {
        text: 'Top listas por commits'
      },
      xAxis: {
        categories,
        title: {
          text: null
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Commits',
          align: 'high'
        },
        labels: {
          overflow: 'justify'
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true
          }
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
        shadow: true
      },
      series: [{
        name: 'Commits',
        data: data.topListByCommits.map(({ commits }) => commits)
      }],
      credits: { enabled: false },
      exporting: { enabled: false }
    })
  },

  topListByLinks () {
    const categories = data.topListByLinks.map(({ owner, name }) => `${owner}/${name}`)

    Highcharts.chart(containerForChart('topListByLinks'), {
      chart: {
        type: 'bar',
        height: 720
      },
      title: {
        text: 'Top listas por links'
      },
      xAxis: {
        categories,
        title: {
          text: null
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Links',
          align: 'high'
        },
        labels: {
          overflow: 'justify'
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true
          }
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
        shadow: true
      },
      series: [{
        name: 'Links',
        data: data.topListByLinks.map(({ links }) => links)
      }],
      credits: { enabled: false },
      exporting: { enabled: false }
    })
  },

  topUserByLists () {
    const categories = data.topUserByLists.map(({ name }) => name)

    Highcharts.chart(containerForChart('topUserByLists'), {
      chart: {
        type: 'bar',
        height: 720
      },
      title: {
        text: 'Top usuários por listas'
      },
      xAxis: {
        categories,
        title: {
          text: null
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Listas',
          align: 'high'
        },
        labels: {
          overflow: 'justify'
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true
          }
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
        shadow: true
      },
      series: [{
        name: 'Listas',
        data: data.topUserByLists.map(({ lists }) => lists)
      }],
      credits: { enabled: false },
      exporting: { enabled: false }
    })
  },

  topUserByCommits () {
    const categories = data.topUserByCommits.map(({ name }) => name)

    Highcharts.chart(containerForChart('topUserByCommits'), {
      chart: {
        type: 'bar',
        height: 720
      },
      title: {
        text: 'Top usuários por commits'
      },
      xAxis: {
        categories,
        title: {
          text: null
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Commits',
          align: 'high'
        },
        labels: {
          overflow: 'justify'
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true
          }
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
        shadow: true
      },
      series: [{
        name: 'Commits',
        data: data.topUserByCommits.map(({ commits }) => commits)
      }],
      credits: { enabled: false },
      exporting: { enabled: false }
    })
  },

  topUserByLinks () {
    const categories = data.topUserByLinks.map(({ name }) => name)

    Highcharts.chart(containerForChart('topUserByLinks'), {
      chart: {
        type: 'bar',
        height: 720
      },
      title: {
        text: 'Top usuários por links'
      },
      xAxis: {
        categories,
        title: {
          text: null
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Links',
          align: 'high'
        },
        labels: {
          overflow: 'justify'
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true
          }
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
        shadow: true
      },
      series: [{
        name: 'Links',
        data: data.topUserByLinks.map(({ links }) => links)
      }],
      credits: { enabled: false },
      exporting: { enabled: false }
    })
  },

  topLink () {
    const categories = data.topLink.map(({ url }) => url)

    Highcharts.chart(containerForChart('topLink'), {
      chart: {
        type: 'bar',
        height: 720
      },
      title: {
        text: 'Top Links'
      },
      xAxis: {
        categories,
        title: {
          text: null
        }
      },
      yAxis: {
        min: 0,
        title: {
          text: 'Links',
          align: 'high'
        },
        labels: {
          overflow: 'justify'
        }
      },
      plotOptions: {
        bar: {
          dataLabels: {
            enabled: true
          }
        }
      },
      legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        x: -40,
        y: 80,
        floating: true,
        borderWidth: 1,
        backgroundColor: ((Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'),
        shadow: true
      },
      series: [{
        name: 'Ativos',
        data: data.topLink.map(({ times }) => times)
      }],
      credits: { enabled: false },
      exporting: { enabled: false }
    })
  }
}

Reveal.addEventListener( 'ready', () => {
	Object.values(charts).forEach(chart => chart())
})

function containerForChart (chartId) {
  return `${chartId}-container`
}