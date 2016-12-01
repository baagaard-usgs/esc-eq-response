"""
Create plot of strike-parallel versus depth and
strike-perpendicular versus depth cross sections.
"""

import pytz
import numpy
import math

from matplotlib.dates import date2num

from Figure import Figure

class PlotXSections(Figure):
    """
    Figure with seismicity cross sections.
    """

    def __init__(self, now, faultStrikeDeg, sectionWidthKm=5.0):
        """
        Constructor.

        Parameters
        ----------
        faultStrikeDeg: Fault strike in degrees.
        sectionWidthKm: Distance from strike in kilometers to include earthquakes.
        """
        Figure.__init__(self, color="lightbg", fontsize=10)
        self.tz = pytz.timezone("UTC")
        self.now = now
        self.faultStrikeDeg = faultStrikeDeg
        self.sectionWidthKm = sectionWidthKm
        self.x0 = None
        self.y0 = None
        return

    def plot(self, seismicity):
        """
        Generate plot.

        Parameters
        ----------
        seismicity: Seismicity to plot.
        """
        self.open(
            width=7.0,
            height=8.0,
            margins=((0.52, 0, 0.12), (0.42, 0.7, 0.3)))

        self.x0 = seismicity.mainshock.x
        self.y0 = seismicity.mainshock.y

        # Strike vs. Depth
        ax = self.axes(2, 1, 1, 1)
        ax.axhline(0.0, linestyle="-", color="fg")
        self._plot_events(ax, seismicity.historical, xaxis="along-strike", zorder=2, color="gray")
        self._plot_events(ax, seismicity.mainshock, xaxis="along-strike", zorder=3, color="ltblue")
        self._plot_events(ax, seismicity.aftershocks, xaxis="along-strike", zorder=4)
        ax.set_xlabel('Dist. along strike (km)')
        ax.set_ylabel("Depth (km)")
        ax.invert_yaxis()
        ylim = ax.get_ylim()
        ax.set_ylim(0.0, ylim[1])
        ax.set_aspect("equal")
        ax.autoscale()
        xlim = ax.get_xlim()
        ax.text(xlim[0]*0.9, 0, "A", horizontalalignment="center")
        ax.text(xlim[1]*0.9, 0, "A'", horizontalalignment="center")

        # Perp-Strike vs Depth
        ax = self.axes(2, 1, 2, 1)
        ax.axvline(0.0, linestyle=":", color="fg")
        self._plot_events(ax, seismicity.historical, xaxis="perp-strike", zorder=2, color="gray")
        self._plot_events(ax, seismicity.mainshock, xaxis="perp-strike", zorder=3, color="ltblue")
        self._plot_events(ax, seismicity.aftershocks, xaxis="perp-strike", zorder=4)
        ax.set_xlabel('Dist. perp to strike (km)')
        ax.set_ylabel("Depth (km)")
        ax.set_aspect("equal")
        ax.autoscale()
        ylim = ax.get_ylim()
        ax.set_ylim(0.0, ylim[1])
        ax.invert_yaxis()
        xlim = ax.get_xlim()
        ax.text(xlim[0]*0.9, 0, "B", horizontalalignment="center")
        ax.text(xlim[1]*0.9, 0, "B'", horizontalalignment="center")
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

    def _plot_events(self, ax, catalog, xaxis, zorder, color=None):
        """
        Plot catalog of earthquakes.

        Parameters
        ----------
        ax: Axis to add earthquakes to.
        catalog: Catalog of earthquakes.
        color: Color for earthquake markers.
        xaxis: x-axis identifier ["perp-strike", "along-strike"]
        zorder: Z order of earthquake markers.
        """
        az = self.faultStrikeDeg*math.pi/180.0
        xstrike = 0.001*((catalog.x-self.x0)*math.sin(az) + (catalog.y-self.y0)*math.cos(az))
        xperp = 0.001*((catalog.x-self.x0)*math.cos(az) - (catalog.y-self.y0)*math.sin(az))
        if xaxis == "along-strike":
            xp = xstrike
        elif xaxis == "perp-strike":
            xp = xperp
        yp = catalog.depth

        msize = self._marker_size(catalog)
        mask = None
        if color is None:
            age = date2num(self.now)-catalog.originTime
            if isinstance(xp, numpy.ndarray):
                mask = numpy.abs(xperp) <= self.sectionWidthKm
                xp = xp[mask]
                yp = yp[mask]
                msize = msize[mask]
                age = age[mask]
            ax.scatter(
                xp,
                yp,
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
            if isinstance(xp, numpy.ndarray):
                mask = numpy.abs(xperp) <= self.sectionWidthKm
                xp = xp[mask]
                yp = yp[mask]
                msize = msize[mask]
            ax.scatter(
                xp,
                yp,
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
