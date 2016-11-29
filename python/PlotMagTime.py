"""
Create plot of earthquake magnitude versus time using Matplotlib.
"""

import pytz
import numpy

from matplotlib.dates import AutoDateLocator, DateFormatter, date2num

from Figure import Figure

DAY_TO_SECS = 24*3600.0
YEAR_TO_SECS = 365.25*DAY_TO_SECS

class PlotMagTime(Figure):
    """
    Figure with earthquake magnitude versus time.
    """

    def __init__(self, now):
        """
        Constructor.

        Parameters
        ----------
        now: Timestamp of plot.
        """
        Figure.__init__(self, color="lightbg", fontsize=10)
        self.tz = pytz.timezone("UTC")
        self.now = now
        return

    def plot(self, seismicity):
        """
        Generate plot.

        Parameters
        ----------
        seismicity: Seismicity to plot.
        """
        if seismicity.aftershocks.count:
            duration = seismicity.aftershocks.originTime[-1] - seismicity.mainshock.originTime
        else:
            duration = DAY_TO_SECS
        if duration <= 5*DAY_TO_SECS:
            formatter = DateFormatter("%b %d %H:%M", self.tz)
            locator = AutoDateLocator(maxticks=7)
        elif duration <= 31*DAY_TO_SECS:
            formatter = DateFormatter("%b %d", self.tz)
            locator = AutoDateLocator(maxticks=10, minticks=5)
        elif duration <= 366*DAY_TO_SECS:
            formatter = DateFormatter("%b %d", self.tz)
            locator = AutoDateLocator(minticks=5)
        else:
            formatter = DateFormatter("%b %Y", self.tz)
            locator = AutoDateLocator(minticks=6)
        locator.set_tzinfo(self.tz)

        self.open(
            width=7.0,
            height=5.0,
            margins=((0.65, 0, 0.1), (0.3, 0.7, 0.3)))
        ax = self.axes(2, 1, 1, 1)
        self._plot_events(ax, seismicity.historical, color="gray")
        self._plot_events(ax, seismicity.mainshock, color="ltblue")
        self._plot_events(ax, seismicity.aftershocks)
        tmin = seismicity.mainshock.originTime - 1
        if seismicity.aftershocks.count:
            tmax = seismicity.aftershocks.originTime[-1]
        else:
            tmax = tmin+2.0
        tlim = (tmin, tmax)
        ax.set_xlim(tlim)
        ax.set_xlabel("")
        ax.xaxis_date()
        ax.xaxis.set_major_locator(locator)
        ax.xaxis.set_major_formatter(formatter)
        ax.set_ylabel("Magnitude")
        ax.set_title("Magnitude versus Time", fontweight="bold")

        # Aftershocks Cumulative sum
        ax = self.axes(2, 1, 2, 1)
        nevents = seismicity.aftershocks.count
        csum = numpy.arange(0, nevents, 1.0, dtype=numpy.float)
        ax.plot(seismicity.aftershocks.originTime, csum, color="ltblue")
        ax.set_xlabel("")
        ax.xaxis_date()
        ax.set_xlim(tlim)
        ax.xaxis.set_major_locator(locator)
        ax.xaxis.set_major_formatter(formatter)
        ax.set_ylabel("Cumulative # of Eqs")
        ax.set_title("Cumulative # of Aftershocks", fontweight="bold")

        return

    def save(self, filename):
        """
        Save plot to file.

        Parameters
        ----------
        filename: Filename for plot.
        """
        self.figure.savefig(filename)
        return

    def _plot_events(self, ax, catalog, color=None):
        """
        Plot catalog of earthquakes.

        Parameters
        ----------
        ax: Axis to add earthquakes to.
        catalog: Catalog of earthquakes.
        color: Color for earthquake markers.
        """
        msize = self._marker_size(catalog)
        if color is None:
            age = date2num(self.now)-catalog.originTime
            #age = 5*numpy.ones(t.shape) # force yellow
            ax.scatter(
                catalog.originTime,
                catalog.magnitude,
                c=age,
                s=msize**2,
                marker="o",
                cmap=self.eqcmap,
                alpha=0.5,
                vmin=0,
                vmax=30.0,
                edgecolors="fg",
                linewidth=0.5)
        else:
            ax.scatter(
                catalog.originTime,
                catalog.magnitude,
                s=msize**2,
                marker="o",
                alpha=0.5,
                facecolors=color,
                edgecolors="fg",
                linewidth=0.5)
        return


    def _marker_size(self, catalog):
        """
        Compute size of earthquake marker.
        """
        size = 2**(catalog.magnitude-1)
        return size


# End of file
