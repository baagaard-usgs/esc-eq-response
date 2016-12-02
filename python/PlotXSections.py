"""
Create plot of strike-parallel versus depth and
strike-perpendicular versus depth cross sections.
"""

import pytz
import numpy
import math
import StringIO

from matplotlib.dates import date2num

from Figure import Figure

class PlotXSections(Figure):
    """
    Figure with seismicity cross sections.
    """

    def __init__(self, now, faultStrikeDeg, sectionLengthKm=40.0, sectionWidthKm=5.0):
        """
        Constructor.

        Parameters
        ----------
        faultStrikeDeg: Fault strike in degrees.
        sectionLengthKm: Distance along strike in kilometers to include earthquakes.
        sectionWidthKm: Distance from strike in kilometers to include earthquakes.
        """
        Figure.__init__(self, color="lightbg", fontsize=10)
        self.tz = pytz.timezone("UTC")
        self.now = now
        self.faultStrikeDeg = faultStrikeDeg
        self.sectionLengthKm = sectionLengthKm
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
            width=7.5,
            height=10.0,
            margins=((0.52, 0, 0.12), (0.42, 0.7, 0.3)))

        self.x0 = seismicity.mainshock.x
        self.y0 = seismicity.mainshock.y

        # from matplotlib import gridspec
        #gridspec.GridSpec(2,2, width_ratios=[1,2], height_ratios=[4,1])

        # Map view
        ax = self.axes(2, 1, 1, 1)
        self._plot_events(ax, seismicity.historical, view="map", zorder=2, color="gray")
        self._plot_events(ax, seismicity.mainshock, view="map", zorder=3, color="ltblue")
        self._plot_events(ax, seismicity.aftershocks, view="map", zorder=4)
        ax.set_xlabel('East (km)')
        ax.set_ylabel("North (km)")
        ax.set_aspect("equal")
        ax.autoscale()
        
        az = self.faultStrikeDeg*math.pi/180.0
        l = self.sectionLengthKm
        w = self.sectionWidthKm
        xpA = numpy.array([0.0, 0.0])
        ypA = numpy.array([-l, +l])
        xA = xpA*math.cos(az) + ypA*math.sin(az)
        yA = -xpA*math.sin(az) + ypA*math.cos(az)
        ax.plot(xA, yA, linewidth=1, alpha=0.5, color="green")
        ax.text(xA[0], yA[0], "A", horizontalalignment="center", verticalalignment="center", fontweight="bold", color="green")
        ax.text(xA[1], yA[1], "A'", horizontalalignment="center", verticalalignment="center", fontweight="bold", color="green")

        xpB = numpy.array([+w, -w])
        ypB = numpy.array([-0.9*l, -0.9*l])
        xB = xpB*math.cos(az) + ypB*math.sin(az)
        yB = -xpB*math.sin(az) + ypB*math.cos(az)
        ax.plot(xB, yB, linewidth=1, alpha=0.5, color="green")
        ax.text(xB[0], yB[0], "B", horizontalalignment="center", verticalalignment="center", color="green")
        ax.text(xB[1], yB[1], "B'", horizontalalignment="center", verticalalignment="center", color="green")

        # Strike vs. Depth
        ax = self.axes(4, 1, 3, 1)
        ax.axhline(0.0, linestyle="-", color="fg")
        self._plot_events(ax, seismicity.historical, view="along-strike", zorder=2, color="gray")
        self._plot_events(ax, seismicity.mainshock, view="along-strike", zorder=3, color="ltblue")
        self._plot_events(ax, seismicity.aftershocks, view="along-strike", zorder=4)
        ax.set_xlabel('Dist. along strike (km)')
        ax.set_ylabel("Depth (km)")
        ax.invert_yaxis()
        ax.set_aspect("equal")
        ylim = ax.get_ylim()
        ax.set_ylim(ylim[0], 0)
        ax.set_xlim(-l, l)
        ax.text(-l*0.9, 0, "A", horizontalalignment="center")
        ax.text(+l*0.9, 0, "A'", horizontalalignment="center")
        axStrike = ax

        # Perp-Strike vs Depth
        ax = self.axes(4, 1, 4, 1, sharey=axStrike)
        ax.axvline(0.0, linestyle=":", color="fg")
        self._plot_events(ax, seismicity.historical, view="perp-strike", zorder=2, color="gray")
        self._plot_events(ax, seismicity.mainshock, view="perp-strike", zorder=3, color="ltblue")
        self._plot_events(ax, seismicity.aftershocks, view="perp-strike", zorder=4)
        ax.set_xlabel('Dist. perp to strike (km)')
        ax.set_ylabel("Depth (km)")
        ax.set_aspect("equal")
        ax.set_xlim(-w,w)
        ax.text(-w*0.9, 0, "B", horizontalalignment="center")
        ax.text(+w*0.9, 0, "B'", horizontalalignment="center")
        return

    def save(self, filename):
        """
        Save plot to file.

        Parameters
        ----------
        filename: Filename for plot.
        """
        self.figure.savefig(filename)
        #img = StringIO.StringIO()
        #self.figure.savefig(img, format="svg")
        #img.seek(0)
        #print img.buf

        return

    def _plot_events(self, ax, catalog, view, zorder, color=None):
        """
        Plot catalog of earthquakes.

        Parameters
        ----------
        ax: Axis to add earthquakes to.
        catalog: Catalog of earthquakes.
        color: Color for earthquake markers.
        view: x-axis identifier ["perp-strike", "along-strike"]
        zorder: Z order of earthquake markers.
        """

        az = self.faultStrikeDeg*math.pi/180.0
        xStrike = 0.001*((catalog.x-self.x0)*math.sin(az) + (catalog.y-self.y0)*math.cos(az))
        xPerp = -0.001*((catalog.x-self.x0)*math.cos(az) - (catalog.y-self.y0)*math.sin(az))
        xDepth = catalog.depth

        if view == "map":
            xp = 0.001*(catalog.x - self.x0)
            yp = 0.001*(catalog.y - self.y0)
        elif view == "along-strike":
            xp = xStrike
            yp = xDepth
        elif view == "perp-strike":
            xp = xPerp
            yp = xDepth

        age = date2num(self.now)-catalog.originTime
        msize = self._marker_size(catalog)
        if isinstance(xp, numpy.ndarray):
                mask = numpy.bitwise_and(numpy.abs(xStrike) <= self.sectionLengthKm, numpy.abs(xPerp) <= self.sectionWidthKm)
                xp = xp[mask]
                yp = yp[mask]
                msize = msize[mask]
                age = age[mask]

        if color is None:
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
